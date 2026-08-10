'use server'

import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type ManualSaleState =
  | { errors: Record<string, string[]> }
  | { success: true; orderNumber: string }
  | undefined

function parseError(msg: string): string {
  if (msg.includes('first_name_required'))          return 'El nombre del cliente es requerido.'
  if (msg.includes('items_required'))               return 'Agrega al menos un producto.'
  if (msg.includes('sale_channel_required'))        return 'Selecciona un canal de venta.'
  if (msg.includes('payment_method_required'))      return 'Selecciona un método de pago.'
  if (msg.includes('no_active_inventory_location')) return 'No hay ubicación de inventario activa configurada.'
  if (msg.includes('product_not_found'))            return 'Uno o más productos no están disponibles.'
  if (msg.includes('insufficient_stock')) {
    const parts = msg.split(':')
    const available = parts[2] ?? '0'
    const requested = parts[3] ?? '?'
    return `Stock insuficiente: disponible ${available}, solicitado ${requested}.`
  }
  if (msg.includes('invalid_quantity'))   return 'Cantidades inválidas.'
  if (msg.includes('invalid_unit_price')) return 'Precios inválidos.'
  return msg
}

export async function createManualSaleAction(
  _prev: ManualSaleState,
  formData: FormData
): Promise<ManualSaleState> {
  await verifySession()
  const ok = await checkPermission('sales.manual')
  if (!ok) return { errors: { _: ['Sin permiso para registrar ventas manuales.'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName   = (formData.get('first_name')          as string)?.trim() || ''
  const lastName    = (formData.get('last_name')            as string)?.trim() || null
  const phone       = (formData.get('phone')                as string)?.trim() || null
  const email       = (formData.get('email')                as string)?.trim() || null
  const address     = (formData.get('address')              as string)?.trim() || null
  const saleChannel = (formData.get('sale_channel')         as string)?.trim() || ''
  const payMethod   = (formData.get('payment_method')       as string)?.trim() || ''
  const payRef      = (formData.get('payment_reference')    as string)?.trim() || null
  const discount    = parseFloat(formData.get('discount_amount') as string) || 0
  const shipping    = parseFloat(formData.get('shipping_amount') as string) || 0
  const notes       = (formData.get('notes')                as string)?.trim() || null
  const currency    = (formData.get('currency')             as string) || 'USD'
  const itemsRaw    = (formData.get('items')                as string) || '[]'

  const errors: Record<string, string[]> = {}
  if (!firstName)    errors.first_name    = ['El nombre es requerido.']
  if (!saleChannel)  errors.sale_channel  = ['Selecciona un canal.']
  if (!payMethod)    errors.payment_method = ['Selecciona un método de pago.']

  let items: unknown[]
  try {
    items = JSON.parse(itemsRaw)
    if (!Array.isArray(items) || items.length === 0)
      errors.items = ['Agrega al menos un producto.']
  } catch {
    errors.items = ['Lista de productos inválida.']
    items = []
  }

  if (Object.keys(errors).length) return { errors }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_manual_sale', {
    p_first_name:        firstName,
    p_last_name:         lastName,
    p_phone:             phone,
    p_email:             email,
    p_address:           address,
    p_sale_channel:      saleChannel,
    p_payment_method:    payMethod,
    p_payment_reference: payRef,
    p_discount_amount:   discount,
    p_shipping_amount:   shipping,
    p_notes:             notes,
    p_items:             items,
    p_currency:          currency,
    p_created_by:        user?.id ?? null,
  })

  if (error) return { errors: { _: [parseError(error.message)] } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = data as any
  redirect(`/admin/orders/${result.order_id}`)
}
