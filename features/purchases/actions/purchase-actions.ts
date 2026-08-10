'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type PurchaseActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── createPurchaseOrderAction ────────────────────────────────────────────────

export async function createPurchaseOrderAction(
  _prev: PurchaseActionState,
  formData: FormData
): Promise<PurchaseActionState> {
  try { await requirePermission('purchases.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference    = (formData.get('reference')     as string)?.trim()
  const supplierName = (formData.get('supplier_name') as string)?.trim() || null
  const currency     = (formData.get('currency')      as string) || 'USD'
  const notes        = (formData.get('notes')         as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference)                              errors.reference = ['La referencia es obligatoria.']
  if (!['USD', 'EUR', 'VES'].includes(currency)) errors.currency = ['Moneda no válida.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({ reference, supplier_name: supplierName, currency, notes, created_by: user?.id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { errors: { reference: ['Ya existe una orden con esa referencia.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/purchases')
  redirect(`/admin/purchases/${data.id}`)
}

// ─── addPurchaseItemAction ────────────────────────────────────────────────────

export async function addPurchaseItemAction(
  orderId: string,
  _prev: PurchaseActionState,
  formData: FormData
): Promise<PurchaseActionState> {
  try { await requirePermission('purchases.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId = (formData.get('product_id') as string)?.trim()
  const quantity  = parseInt(formData.get('quantity') as string)
  const unitCost  = parseFloat(formData.get('unit_cost') as string)

  const errors: Record<string, string[]> = {}
  if (!productId)                                      errors.product_id = ['El producto es obligatorio.']
  if (!Number.isFinite(quantity) || quantity <= 0)     errors.quantity   = ['La cantidad debe ser mayor a cero.']
  if (!Number.isFinite(unitCost) || unitCost <= 0)     errors.unit_cost  = ['El costo unitario debe ser mayor a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order)                return { errors: { _: ['Orden no encontrada.'] } }
  if (order.status !== 'draft') return { errors: { _: ['Solo se pueden agregar ítems a órdenes en borrador.'] } }

  const total = quantity * unitCost

  const { error: insertError } = await supabase
    .from('purchase_order_items')
    .insert({ purchase_order_id: orderId, product_id: productId, quantity, unit_cost: unitCost, total })

  if (insertError) return { errors: { _: [insertError.message] } }

  // Recalculate subtotal
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('total')
    .eq('purchase_order_id', orderId)

  const subtotal = (items ?? []).reduce((acc, i) => acc + i.total, 0)
  await supabase.from('purchase_orders').update({ subtotal }).eq('id', orderId)

  revalidatePath(`/admin/purchases/${orderId}`)
  return { success: true, message: 'Producto agregado.' }
}

// ─── removePurchaseItemAction ─────────────────────────────────────────────────

export async function removePurchaseItemAction(
  itemId: string,
  orderId: string
): Promise<{ error?: string }> {
  try { await requirePermission('purchases.update') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (order && order.status !== 'draft')
    return { error: 'Solo se pueden eliminar ítems de órdenes en borrador.' }

  const { error } = await supabase
    .from('purchase_order_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }

  // Recalculate subtotal
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('total')
    .eq('purchase_order_id', orderId)

  const subtotal = (items ?? []).reduce((acc, i) => acc + i.total, 0)
  await supabase.from('purchase_orders').update({ subtotal }).eq('id', orderId)

  revalidatePath(`/admin/purchases/${orderId}`)
  return {}
}

// ─── sendPurchaseOrderAction ──────────────────────────────────────────────────

export async function sendPurchaseOrderAction(
  orderId: string
): Promise<{ error?: string }> {
  try { await requirePermission('purchases.send') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select('status, purchase_order_items(id)')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Orden no encontrada.' }
  if (order.status !== 'draft') return { error: 'Solo se pueden enviar órdenes en borrador.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((order as any).purchase_order_items?.length === 0)
    return { error: 'La orden no tiene productos. Agrega al menos uno antes de enviar.' }

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'sent', sent_by: user?.id, sent_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/admin/purchases')
  revalidatePath(`/admin/purchases/${orderId}`)
  return {}
}

// ─── cancelPurchaseOrderAction ────────────────────────────────────────────────

export async function cancelPurchaseOrderAction(
  orderId: string
): Promise<{ error?: string }> {
  try { await requirePermission('purchases.cancel') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Orden no encontrada.' }
  if (['completed', 'cancelled'].includes(order.status))
    return { error: 'No se puede cancelar una orden completada o ya cancelada.' }

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled', cancelled_by: user?.id, cancelled_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/admin/purchases')
  revalidatePath(`/admin/purchases/${orderId}`)
  return {}
}
