/**
 * Servicio central de inventario — Lanz Technology OS
 *
 * REGLA FUNDAMENTAL: el stock NUNCA se modifica directamente.
 * Todo cambio en inventory_balances pasa por este servicio, que delega
 * a las funciones SECURITY DEFINER de la base de datos:
 *   - record_inventory_movement()   → modifica on_hand
 *   - reserve_inventory_movement()  → modifica reserved
 *
 * Todos los módulos futuros (compras, ventas, pedidos, importaciones)
 * deben usar este servicio. No llamar a las funciones de DB directamente.
 */

import { createClient } from '@/lib/supabase/server'

// ─── Tipos del servicio ────────────────────────────────────────────────────────

export type MovementType = 'entry' | 'exit' | 'adjustment' | 'reservation' | 'release'

export type MovementParams = {
  productId:     string
  locationId:    string
  type:          MovementType
  quantity:      number          // siempre positivo; el servicio aplica el signo
  reason:        string
  notes?:        string
  referenceType?: string
  referenceId?:  string
  createdBy?:    string
}

export type MovementResult =
  | { success: true; movementId: string; quantityBefore: number; quantityAfter: number }
  | { success: false; error: string }

// Mapeo de tipos de la app → tipos del DB (inventory_movements.movement_type CHECK)
const DB_TYPE_MAP: Record<MovementType, string> = {
  entry:       'adjustment_in',
  exit:        'adjustment_out',
  adjustment:  'adjustment_in',   // sobreescrito por el signo real en el servicio
  reservation: 'reservation',
  release:     'release',
}

// ─── Función de saldo por defecto ────────────────────────────────────────────

export async function getDefaultLocationId(): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code', { ascending: true })
    .limit(1)
    .single()

  if (error || !data)
    throw new Error('No hay ubicaciones de inventario activas configuradas.')

  return data.id
}

// ─── Servicio central ─────────────────────────────────────────────────────────

export async function recordMovement(params: MovementParams): Promise<MovementResult> {
  const { productId, locationId, type, quantity, reason, notes, referenceType, referenceId, createdBy } = params

  if (quantity <= 0)
    return { success: false, error: 'La cantidad debe ser mayor a cero.' }

  if (!reason?.trim())
    return { success: false, error: 'El motivo es obligatorio.' }

  const supabase = await createClient()

  try {
    if (type === 'reservation' || type === 'release') {
      // Delegado a reserve_inventory_movement()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('reserve_inventory_movement', {
        p_product_id:     productId,
        p_location_id:    locationId,
        p_movement_type:  DB_TYPE_MAP[type],
        p_quantity:       quantity,
        p_reason:         reason,
        p_notes:          notes ?? null,
        p_reference_type: referenceType ?? null,
        p_reference_id:   referenceId   ?? null,
        p_created_by:     createdBy     ?? null,
      })

      if (error) return { success: false, error: error.message }
      return {
        success:         true,
        movementId:      data.id,
        quantityBefore:  data.quantity_before,
        quantityAfter:   data.quantity_after,
      }
    }

    // entry / exit / adjustment → record_inventory_movement()
    // entry: +quantity, exit: -quantity, adjustment: ±quantity (sign from params)
    const signedQty =
      type === 'exit'
        ? -Math.abs(quantity)
        : Math.abs(quantity)

    const dbType =
      type === 'adjustment'
        ? (signedQty >= 0 ? 'adjustment_in' : 'adjustment_out')
        : DB_TYPE_MAP[type]

    const { data, error } = await supabase.rpc('record_inventory_movement', {
      p_product_id:     productId,
      p_location_id:    locationId,
      p_movement_type:  dbType,
      p_quantity:       signedQty,
      p_reason:         reason,
      p_notes:          notes          ?? undefined,
      p_reference_type: referenceType  ?? undefined,
      p_reference_id:   referenceId    ?? undefined,
      p_created_by:     createdBy      ?? undefined,
    })

    if (error) return { success: false, error: error.message }
    return {
      success:        true,
      movementId:     data.id,
      quantityBefore: data.quantity_before,
      quantityAfter:  data.quantity_after,
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
