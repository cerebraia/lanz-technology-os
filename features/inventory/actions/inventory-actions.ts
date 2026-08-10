'use server'

import { revalidatePath } from 'next/cache'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import {
  recordMovement,
  getDefaultLocationId,
} from '@/lib/inventory/inventory-service'

export type MovementActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string; movementId: string }
  | undefined

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireInventoryPermission(permission: string) {
  await verifySession()
  const ok = await checkPermission(permission)
  if (!ok) throw new Error(`Sin permiso: ${permission}`)
}

async function validateProduct(productId: string) {
  if (!productId?.trim())
    return 'El producto es obligatorio.'
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, status')
    .eq('id', productId)
    .single()
  if (!data)         return 'Producto no encontrado.'
  if (data.status === 'archived') return 'El producto está archivado.'
  return null
}

function parseQty(raw: FormDataEntryValue | null): number | null {
  const n = parseInt(String(raw ?? ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// ─── createInventoryEntry ─────────────────────────────────────────────────────
// Registra una entrada de stock (adjustment_in).
// Permisos: inventory.receive

export async function createInventoryEntry(
  _prev: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  try { await requireInventoryPermission('inventory.receive') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId = formData.get('product_id') as string
  const quantity  = parseQty(formData.get('quantity'))
  const reason    = (formData.get('reason') as string)?.trim()
  const notes     = (formData.get('notes') as string)?.trim() || undefined

  const errors: Record<string, string[]> = {}
  const productErr = await validateProduct(productId)
  if (productErr)   errors.product_id = [productErr]
  if (!quantity)    errors.quantity   = ['La cantidad debe ser un entero mayor a cero.']
  if (!reason)      errors.reason     = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const locationId = await getDefaultLocationId()
  const result = await recordMovement({
    productId, locationId, type: 'entry', quantity: quantity!, reason, notes,
  })

  if (!result.success) return { errors: { _: [result.error] } }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/movements')
  return { success: true, message: `Entrada registrada. Stock: ${result.quantityBefore} → ${result.quantityAfter}`, movementId: result.movementId }
}

// ─── createInventoryExit ──────────────────────────────────────────────────────
// Registra una salida de stock (adjustment_out).
// Permisos: inventory.adjust (salidas manuales son ajustes)

export async function createInventoryExit(
  _prev: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  try { await requireInventoryPermission('inventory.adjust') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId = formData.get('product_id') as string
  const quantity  = parseQty(formData.get('quantity'))
  const reason    = (formData.get('reason') as string)?.trim()
  const notes     = (formData.get('notes') as string)?.trim() || undefined

  const errors: Record<string, string[]> = {}
  const productErr = await validateProduct(productId)
  if (productErr)  errors.product_id = [productErr]
  if (!quantity)   errors.quantity   = ['La cantidad debe ser un entero mayor a cero.']
  if (!reason)     errors.reason     = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const locationId = await getDefaultLocationId()
  const result = await recordMovement({
    productId, locationId, type: 'exit', quantity: quantity!, reason, notes,
  })

  if (!result.success) return { errors: { _: [result.error] } }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/movements')
  return { success: true, message: `Salida registrada. Stock: ${result.quantityBefore} → ${result.quantityAfter}`, movementId: result.movementId }
}

// ─── createInventoryAdjustment ────────────────────────────────────────────────
// Ajuste controlado (positivo o negativo).
// Permisos: inventory.adjust

export async function createInventoryAdjustment(
  _prev: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  try { await requireInventoryPermission('inventory.adjust') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId  = formData.get('product_id') as string
  const rawQty     = parseInt(String(formData.get('quantity') ?? ''))
  const direction  = formData.get('direction') as string  // 'in' | 'out'
  const reason     = (formData.get('reason') as string)?.trim()
  const notes      = (formData.get('notes') as string)?.trim() || undefined

  const quantity = Number.isFinite(rawQty) && rawQty !== 0 ? rawQty : null

  const errors: Record<string, string[]> = {}
  const productErr = await validateProduct(productId)
  if (productErr)                     errors.product_id = [productErr]
  if (!quantity)                      errors.quantity   = ['La cantidad debe ser un entero distinto de cero.']
  if (!['in', 'out'].includes(direction)) errors.direction  = ['Dirección inválida.']
  if (!reason)                        errors.reason     = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const absQty     = Math.abs(quantity!)
  const locationId = await getDefaultLocationId()

  // direction='out' uses type 'exit' so the service applies a negative sign
  // (adjustment_out). direction='in' uses 'adjustment' which stays positive.
  const result = await recordMovement({
    productId, locationId,
    type: direction === 'out' ? 'exit' : 'adjustment',
    quantity: absQty,
    reason, notes,
  })

  if (!result.success) return { errors: { _: [result.error] } }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/movements')
  return { success: true, message: `Ajuste registrado. Stock: ${result.quantityBefore} → ${result.quantityAfter}`, movementId: result.movementId }
}

// ─── createInventoryReservation ───────────────────────────────────────────────
// Reserva unidades disponibles para un pedido u operación.
// Permisos: inventory.reserve

export async function createInventoryReservation(
  _prev: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  try { await requireInventoryPermission('inventory.reserve') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId     = formData.get('product_id') as string
  const quantity      = parseQty(formData.get('quantity'))
  const reason        = (formData.get('reason') as string)?.trim()
  const referenceType = (formData.get('reference_type') as string)?.trim() || undefined
  const referenceId   = (formData.get('reference_id')   as string)?.trim() || undefined
  const notes         = (formData.get('notes') as string)?.trim() || undefined

  const errors: Record<string, string[]> = {}
  const productErr = await validateProduct(productId)
  if (productErr)  errors.product_id = [productErr]
  if (!quantity)   errors.quantity   = ['La cantidad debe ser un entero mayor a cero.']
  if (!reason)     errors.reason     = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const locationId = await getDefaultLocationId()
  const result = await recordMovement({
    productId, locationId, type: 'reservation', quantity: quantity!,
    reason, notes, referenceType, referenceId,
  })

  if (!result.success) return { errors: { _: [result.error] } }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/movements')
  return { success: true, message: `Reserva registrada. Reservado: ${result.quantityBefore} → ${result.quantityAfter}`, movementId: result.movementId }
}

// ─── releaseInventoryReservation ──────────────────────────────────────────────
// Libera unidades reservadas, devolviendo disponibilidad.
// Permisos: inventory.reserve

export async function releaseInventoryReservation(
  _prev: MovementActionState,
  formData: FormData
): Promise<MovementActionState> {
  try { await requireInventoryPermission('inventory.reserve') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId     = formData.get('product_id') as string
  const quantity      = parseQty(formData.get('quantity'))
  const reason        = (formData.get('reason') as string)?.trim()
  const referenceType = (formData.get('reference_type') as string)?.trim() || undefined
  const referenceId   = (formData.get('reference_id')   as string)?.trim() || undefined
  const notes         = (formData.get('notes') as string)?.trim() || undefined

  const errors: Record<string, string[]> = {}
  const productErr = await validateProduct(productId)
  if (productErr)  errors.product_id = [productErr]
  if (!quantity)   errors.quantity   = ['La cantidad debe ser un entero mayor a cero.']
  if (!reason)     errors.reason     = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const locationId = await getDefaultLocationId()
  const result = await recordMovement({
    productId, locationId, type: 'release', quantity: quantity!,
    reason, notes, referenceType, referenceId,
  })

  if (!result.success) return { errors: { _: [result.error] } }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/movements')
  return { success: true, message: `Reserva liberada. Reservado: ${result.quantityBefore} → ${result.quantityAfter}`, movementId: result.movementId }
}
