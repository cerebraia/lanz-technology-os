'use server'

import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type SaleActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string): Promise<{ id: string }> {
  const user = await verifySession()
  const ok   = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
  return user
}

// ─── CANCEL SALE ──────────────────────────────────────────────────────────────

export async function cancelSaleAction(
  orderId: string,
  reason: string
): Promise<{ error?: string }> {
  let userId: string
  try {
    const user = await requirePermission('orders.cancel')
    userId = user.id
  } catch (e) {
    return { error: (e as Error).message }
  }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('status, order_items(product_id, quantity)')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Venta no encontrada.' }

  if (['cancelled', 'refunded', 'delivered'].includes(order.status)) {
    return { error: 'Esta venta no puede ser cancelada.' }
  }

  const { data: locationRow } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code')
    .limit(1)
    .single()

  const locationId = locationRow?.id ?? null

  // Manual sale flow: inventory was deducted as 'sale' movements — reverse with 'return_in'
  if (['confirmed', 'shipped'].includes(order.status) && locationId) {
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('product_id, quantity, location_id')
      .eq('reference_type', 'order')
      .eq('reference_id', orderId)
      .eq('movement_type', 'sale')

    for (const movement of movements ?? []) {
      if (!movement.product_id) continue
      try {
        await supabase.rpc('record_inventory_movement', {
          p_product_id:     movement.product_id,
          p_location_id:    movement.location_id,
          p_movement_type:  'return_in',
          p_quantity:       Math.abs(movement.quantity),
          p_reason:         'Devolución por cancelación',
          p_reference_type: 'order',
          p_reference_id:   orderId,
          p_created_by:     userId,
        })
      } catch {
        // No bloquear la cancelación si falla la devolución de inventario
      }
    }
  }

  // Regular order flow: inventory was reserved — release reservation
  if (['processing', 'preparing'].includes(order.status) && locationId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order as any).order_items as { product_id: string | null; quantity: number }[]
    for (const item of items ?? []) {
      if (!item.product_id) continue
      try {
        await supabase.rpc('reserve_inventory_movement', {
          p_product_id:     item.product_id,
          p_location_id:    locationId,
          p_movement_type:  'release',
          p_quantity:       item.quantity,
          p_reason:         'Liberación por cancelación',
          p_reference_type: 'order',
          p_reference_id:   orderId,
          p_created_by:     userId,
        })
      } catch {
        // Si no había reserva registrada, ignorar
      }
    }
  }

  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  const previousStatus = currentOrder?.status ?? order.status

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status:       'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  await supabase.from('order_status_history').insert({
    order_id:        orderId,
    previous_status: previousStatus,
    new_status:      'cancelled',
    notes:           reason,
    created_by:      userId,
  })

  revalidatePath('/admin/sales')
  revalidatePath(`/admin/sales/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)

  return {}
}

// ─── UPDATE SALE DETAILS ──────────────────────────────────────────────────────

export async function updateSaleDetailsAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  try { await requirePermission('orders.update') } catch (e) {
    return { errors: { _: [(e as Error).message] } }
  }

  const orderId       = (formData.get('order_id')       as string)?.trim()
  const notes         = (formData.get('notes')          as string)?.trim() || null
  const saleChannel   = (formData.get('sale_channel')   as string)?.trim() || null
  const paymentMethod = (formData.get('payment_method') as string)?.trim() || null

  if (!orderId) return { errors: { _: ['ID de venta requerido.'] } }

  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ notes, sale_channel: saleChannel ?? undefined, payment_method: paymentMethod })
    .eq('id', orderId)

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/sales')
  revalidatePath(`/admin/sales/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)

  return { success: true, message: 'Venta actualizada.' }
}

// ─── UPDATE SALE CUSTOMER ─────────────────────────────────────────────────────

export async function updateSaleCustomerAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  try { await requirePermission('customers.update') } catch (e) {
    return { errors: { _: [(e as Error).message] } }
  }

  const customerId = (formData.get('customer_id') as string)?.trim()
  const firstName  = (formData.get('first_name')  as string)?.trim()
  const lastName   = (formData.get('last_name')   as string)?.trim() || null
  const phone      = (formData.get('phone')       as string)?.trim() || null
  const email      = (formData.get('email')       as string)?.trim() || null
  const address    = (formData.get('address')     as string)?.trim() || null

  if (!customerId) return { errors: { _: ['ID de cliente requerido.'] } }
  if (!firstName)  return { errors: { first_name: ['El nombre es requerido.'] } }

  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({ first_name: firstName, last_name: lastName, phone, email, address })
    .eq('id', customerId)

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/sales')

  return { success: true, message: 'Cliente actualizado.' }
}
