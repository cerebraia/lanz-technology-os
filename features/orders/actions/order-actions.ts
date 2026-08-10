'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { getDefaultLocationId } from '@/features/orders/data/orders'

export type OrderActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── CREATE ORDER ──────────────────────────────────────────────────────────────

export async function createOrderAction(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try { await req('orders.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const customerId  = (formData.get('customer_id')  as string) || null
  const saleChannel = (formData.get('sale_channel') as string) || 'direct'
  const currency    = (formData.get('currency')     as string) || 'USD'
  const notes       = (formData.get('notes')        as string)?.trim() || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id:    customerId,
      sale_channel:   saleChannel,
      currency_code:  currency,
      notes,
      status:         'draft',
      payment_status: 'pending',
      created_by:     user?.id,
    })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/orders')
  redirect(`/admin/orders/${data.id}`)
}

// ─── ADD ITEM ──────────────────────────────────────────────────────────────────

export async function addOrderItemAction(
  orderId: string,
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try { await req('orders.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId = (formData.get('product_id') as string)?.trim()
  const quantity  = parseInt(formData.get('quantity') as string)
  const unitPrice = parseFloat(formData.get('unit_price') as string)

  const errors: Record<string, string[]> = {}
  if (!productId)                                   errors.product_id = ['Selecciona un producto.']
  if (!Number.isFinite(quantity) || quantity <= 0)  errors.quantity   = ['La cantidad debe ser mayor a cero.']
  if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.unit_price = ['El precio debe ser mayor o igual a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('status, currency_code')
    .eq('id', orderId)
    .single()

  if (!order)                return { errors: { _: ['Pedido no encontrado.'] } }
  if (order.status !== 'draft') return { errors: { _: ['Solo se pueden agregar productos a pedidos en borrador.'] } }

  const { data: product } = await supabase
    .from('products')
    .select('name, sku, sale_price, reference_cost')
    .eq('id', productId)
    .single()

  if (!product) return { errors: { product_id: ['Producto no encontrado.'] } }

  const lineTotal = quantity * unitPrice

  const { error } = await supabase.from('order_items').insert({
    order_id:      orderId,
    product_id:    productId,
    product_sku:   product.sku,
    product_name:  product.name,
    unit_price:    unitPrice,
    unit_cost:     product.reference_cost ?? null,
    currency_code: order.currency_code,
    quantity,
    discount_amount: 0,
    line_total:    lineTotal,
  })

  if (error) return { errors: { _: [error.message] } }

  await recalcOrderTotals(supabase, orderId)
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true, message: 'Producto agregado.' }
}

// ─── REMOVE ITEM ──────────────────────────────────────────────────────────────

export async function removeOrderItemAction(
  itemId: string,
  orderId: string
): Promise<{ error?: string }> {
  try { await req('orders.update') } catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()
  if (order && order.status !== 'draft') return { error: 'Solo se pueden eliminar productos de pedidos en borrador.' }

  const { error } = await supabase.from('order_items').delete().eq('id', itemId)
  if (error) return { error: error.message }

  await recalcOrderTotals(supabase, orderId)
  revalidatePath(`/admin/orders/${orderId}`)
  return {}
}

// ─── UPDATE STATUS ─────────────────────────────────────────────────────────────

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
  notes?: string
): Promise<{ error?: string }> {
  const perm = newStatus === 'cancelled' ? 'orders.cancel'
             : newStatus === 'shipped'   ? 'orders.ship'
             : 'orders.update'

  try { await req(perm) } catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select('status, order_items(product_id, quantity)')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Pedido no encontrado.' }

  const patch: { status: string; cancelled_at?: string; cancel_reason?: string } = { status: newStatus }
  if (newStatus === 'cancelled') {
    patch.cancelled_at  = new Date().toISOString()
    patch.cancel_reason = notes ?? 'Cancelado por operador'
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
  if (error) return { error: error.message }

  // Record status transition
  await supabase.from('order_status_history').insert({
    order_id:        orderId,
    previous_status: order.status,
    new_status:      newStatus,
    notes:           notes ?? null,
    created_by:      user?.id,
  })

  // Inventory reservation / release
  if (newStatus === 'processing') {
    await reserveInventoryForOrder(supabase, orderId, order.order_items ?? [], user?.id)
  }
  if (['cancelled', 'refunded'].includes(newStatus) && ['processing', 'shipped'].includes(order.status)) {
    await releaseInventoryForOrder(supabase, orderId, order.order_items ?? [], user?.id)
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return {}
}

// ─── ADD PAYMENT ──────────────────────────────────────────────────────────────

export async function addPaymentAction(
  orderId: string,
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try { await req('payments.manage') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const amount    = parseFloat(formData.get('amount')    as string)
  const currency  = (formData.get('currency')  as string) || 'USD'
  const method    = (formData.get('method')    as string)
  const reference = (formData.get('reference') as string)?.trim() || null
  const pnotes    = (formData.get('notes')     as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = ['El monto debe ser mayor a cero.']
  if (!method) errors.method = ['Selecciona un método de pago.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('payments').insert({
    order_id: orderId, amount, currency, method,
    status: 'confirmed', reference, notes: pnotes, created_by: user?.id,
  })
  if (error) return { errors: { _: [error.message] } }

  // Update order payment_status
  await updatePaymentStatus(supabase, orderId)

  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true, message: 'Pago registrado.' }
}

// ─── ADD SHIPMENT ─────────────────────────────────────────────────────────────

export async function addShipmentAction(
  orderId: string,
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try { await req('orders.ship') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const carrier        = (formData.get('carrier')         as string)?.trim() || null
  const trackingNumber = (formData.get('tracking_number') as string)?.trim() || null
  const snotes         = (formData.get('notes')           as string)?.trim() || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('shipments').insert({
    order_id: orderId, carrier, tracking_number: trackingNumber,
    status: 'shipped', shipped_at: new Date().toISOString(),
    notes: snotes, created_by: user?.id,
  })
  if (error) return { errors: { _: [error.message] } }

  // Advance order to shipped if currently processing
  const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()
  if (order && ['processing', 'paid', 'confirmed', 'preparing'].includes(order.status)) {
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId)
    await supabase.from('order_status_history').insert({
      order_id: orderId, previous_status: order.status, new_status: 'shipped',
      notes: `Envío registrado. Tracking: ${trackingNumber ?? 'N/A'}`, created_by: user?.id,
    })
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return { success: true, message: 'Envío registrado.' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recalcOrderTotals(supabase: any, orderId: string) {
  const { data: items } = await supabase
    .from('order_items')
    .select('line_total')
    .eq('order_id', orderId)

  const subtotal    = (items ?? []).reduce((a: number, i: { line_total: number }) => a + i.line_total, 0)
  const totalAmount = subtotal
  await supabase.from('orders').update({ subtotal, total_amount: totalAmount }).eq('id', orderId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updatePaymentStatus(supabase: any, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('id', orderId)
    .single()

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('status', 'confirmed')

  const paid = (payments ?? []).reduce((a: number, p: { amount: number }) => a + p.amount, 0)
  const total = order?.total_amount ?? 0

  const paymentStatus = paid <= 0 ? 'pending' : paid >= total ? 'paid' : 'partial'
  await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reserveInventoryForOrder(supabase: any, orderId: string, items: any[], userId?: string) {
  const locationId = await getDefaultLocationId()
  if (!locationId) return

  for (const item of items) {
    if (!item.product_id) continue
    try {
      await supabase.rpc('reserve_inventory_movement', {
        p_product_id:     item.product_id,
        p_location_id:    locationId,
        p_movement_type:  'reservation',
        p_quantity:       item.quantity,
        p_reason:         'Reserva por pedido',
        p_reference_type: 'order',
        p_reference_id:   orderId,
        p_created_by:     userId ?? null,
      })
    } catch {
      // Stock insuficiente: no bloquear el flujo pero la reserva no se crea
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function releaseInventoryForOrder(supabase: any, orderId: string, items: any[], userId?: string) {
  const locationId = await getDefaultLocationId()
  if (!locationId) return

  for (const item of items) {
    if (!item.product_id) continue
    try {
      await supabase.rpc('reserve_inventory_movement', {
        p_product_id:     item.product_id,
        p_location_id:    locationId,
        p_movement_type:  'release',
        p_quantity:       item.quantity,
        p_reason:         'Liberación por cancelación de pedido',
        p_reference_type: 'order',
        p_reference_id:   orderId,
        p_created_by:     userId ?? null,
      })
    } catch {
      // Si no había reserva, ignorar
    }
  }
}
