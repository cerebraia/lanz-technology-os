'use server'

import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { getDefaultLocationId } from '@/lib/inventory/inventory-service'

export type QuickAdjustState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string; newOnHand: number }
  | undefined

export async function quickAdjustAction(
  _prev: QuickAdjustState,
  formData: FormData
): Promise<QuickAdjustState> {
  await verifySession()
  const canAdjust = await checkPermission('inventory.adjust')
  if (!canAdjust) return { errors: { _: ['Sin permiso para ajustar inventario.'] } }

  const productId   = (formData.get('product_id')  as string)?.trim()
  const newOnHandRaw = (formData.get('new_on_hand') as string)?.trim()
  const reason       = (formData.get('reason')      as string)?.trim() || 'Ajuste rápido desde inventario'
  const currentOnHand = parseInt(formData.get('current_on_hand') as string)

  if (!productId)                              return { errors: { _: ['ID de producto requerido.'] } }
  if (!newOnHandRaw || newOnHandRaw === '')    return { errors: { new_on_hand: ['Ingresa el nuevo stock físico.'] } }

  const newOnHand = parseInt(newOnHandRaw)
  if (isNaN(newOnHand) || newOnHand < 0)      return { errors: { new_on_hand: ['El stock no puede ser negativo.'] } }
  if (newOnHand === currentOnHand)             return { errors: { new_on_hand: ['El valor ingresado es igual al stock actual. No hay diferencia.'] } }

  const diff = newOnHand - currentOnHand

  let locationId: string
  try {
    locationId = await getDefaultLocationId()
  } catch {
    return { errors: { _: ['No hay una ubicación de inventario activa configurada.'] } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const movementType  = diff >= 0 ? 'adjustment_in' : 'adjustment_out'
  const signedQty     = diff   // record_inventory_movement acepta positivo o negativo

  const { error } = await supabase.rpc('record_inventory_movement', {
    p_product_id:     productId,
    p_location_id:    locationId,
    p_movement_type:  movementType,
    p_quantity:       signedQty,
    p_reason:         reason,
    p_reference_type: 'quick_adjustment',
    p_created_by:     user?.id ?? undefined,
  })

  if (error) {
    const msg = error.message
    if (msg.includes('insuficiente') || msg.includes('negativo') || msg.includes('quantity_after'))
      return { errors: { _: ['No hay inventario suficiente para realizar este ajuste.'] } }
    return { errors: { _: ['No se pudo registrar el movimiento. Intenta de nuevo.'] } }
  }

  revalidatePath('/admin/inventory')

  const sign = diff > 0 ? `+${diff}` : String(diff)
  return {
    success:   true,
    message:   `Stock ajustado correctamente (${sign} unidades).`,
    newOnHand,
  }
}
