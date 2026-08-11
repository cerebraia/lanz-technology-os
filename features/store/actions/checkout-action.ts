'use server'

/**
 * checkout-action — Lanz Technology storefront
 *
 * Usa el cliente anon (RLS migration 009) + SECURITY DEFINER function
 * `create_storefront_order` (migration 010).
 *
 * El precio definitivo SIEMPRE lo calcula el servidor en la función SQL.
 * El cliente solo envía: productId + quantity. Nunca precios ni totales.
 */

import { createClient } from '@/lib/supabase/server'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DeliveryMethod = 'pickup' | 'local' | 'national'

export type CheckoutInput = {
  idempotencyKey:  string
  firstName:       string
  lastName:        string
  phone:           string
  whatsapp:        string
  email:           string
  city:            string
  address:         string
  idNumber:        string
  deliveryMethod:  DeliveryMethod
  notes:           string
  items:           { productId: string; quantity: number }[]
  currency:        string
}

export type CheckoutSuccess = {
  success:           true
  orderNumber:       string
  confirmationToken: string
  total:             number | undefined
  currency:          string | undefined
  idempotent:        boolean
}

export type CheckoutError = {
  error: string
  field?: string
}

export type CheckoutResult = CheckoutSuccess | CheckoutError

// Estado que devuelve checkoutFormAction al componente
export type CheckoutFormState =
  | undefined
  | { errors: Record<string, string> }
  | {
      success:           true
      orderNumber:       string
      confirmationToken: string
    }

// ─── Validación server-side (espejo de la función SQL) ────────────────────────

function validateInput(input: CheckoutInput): CheckoutError | null {
  if (!input.firstName.trim())           return { error: 'El nombre es obligatorio.',     field: 'firstName' }
  if (!input.phone.trim())               return { error: 'El teléfono es obligatorio.',   field: 'phone' }
  if (!input.city.trim())                return { error: 'La ciudad es obligatoria.',     field: 'city' }
  if (!input.deliveryMethod)             return { error: 'Selecciona una modalidad.',     field: 'deliveryMethod' }
  if (!(['pickup', 'local', 'national'] as string[]).includes(input.deliveryMethod)) {
    return { error: 'Modalidad no válida.', field: 'deliveryMethod' }
  }
  if (input.deliveryMethod !== 'pickup' && !input.address.trim()) {
    return { error: 'La dirección es obligatoria para esta modalidad.', field: 'address' }
  }
  if (input.email && !input.email.includes('@')) {
    return { error: 'El correo no tiene un formato válido.', field: 'email' }
  }
  if (input.items.length === 0) return { error: 'El carrito está vacío.',                    field: 'items' }
  if (input.items.length > 20)  return { error: 'El carrito supera el máximo de 20 líneas.', field: 'items' }
  if (input.notes.length > 500) return { error: 'Las notas no pueden superar 500 caracteres.', field: 'notes' }
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
      return { error: 'Cantidad inválida en uno de los productos.', field: 'items' }
    }
  }
  return null
}

// ─── Mapeo de errores SQL → mensajes de usuario ───────────────────────────────

function mapSqlError(msg: string): CheckoutError {
  if (msg.includes('first_name_required'))           return { error: 'El nombre es obligatorio.',                         field: 'firstName' }
  if (msg.includes('phone_required'))                return { error: 'El teléfono es obligatorio.',                      field: 'phone' }
  if (msg.includes('city_required'))                 return { error: 'La ciudad es obligatoria.',                        field: 'city' }
  if (msg.includes('invalid_delivery_method'))       return { error: 'Modalidad de entrega no válida.',                  field: 'deliveryMethod' }
  if (msg.includes('address_required_for_delivery')) return { error: 'La dirección es obligatoria para esta modalidad.', field: 'address' }
  if (msg.includes('empty_cart'))                    return { error: 'El carrito está vacío.',                           field: 'items' }
  if (msg.includes('too_many_items'))                return { error: 'El carrito supera el máximo permitido.',           field: 'items' }
  if (msg.includes('product_not_found'))             return { error: 'Uno o más productos no están disponibles.',        field: 'items' }
  if (msg.includes('product_unavailable'))           return { error: 'Uno o más productos ya no están publicados.',      field: 'items' }
  if (msg.includes('insufficient_stock'))            return { error: 'Stock insuficiente para uno de los productos.',    field: 'items' }
  if (msg.includes('invalid_quantity'))              return { error: 'Cantidad inválida en uno de los productos.',       field: 'items' }
  return { error: 'No se pudo crear el pedido. Intenta nuevamente.' }
}

// ─── createStorefrontOrder — llamada directa a la función SQL ─────────────────

export async function createStorefrontOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const validationError = validateInput(input)
  if (validationError) return validationError

  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('create_storefront_order', {
      p_idempotency_key: input.idempotencyKey,
      p_first_name:      input.firstName.trim(),
      p_last_name:       input.lastName.trim()  || null,
      p_phone:           input.phone.trim(),
      p_whatsapp:        input.whatsapp.trim()  || input.phone.trim(),
      p_email:           input.email.trim().toLowerCase() || null,
      p_city:            input.city.trim(),
      p_address:         input.address.trim()   || null,
      p_id_number:       input.idNumber.trim()  || null,
      p_delivery_method: input.deliveryMethod,
      p_notes:           input.notes.trim()     || null,
      p_items:           input.items.map(i => ({
        product_id: i.productId,
        quantity:   i.quantity,
      })),
      p_currency: input.currency,
    })

    if (error) {
      // Log server-side para diagnóstico en Railway — sin datos sensibles
      console.error('[CHECKOUT] RPC error | code:', error.code, '| message:', error.message)
      return mapSqlError(error.message)
    }

    const result = data as {
      order_number:       string
      confirmation_token: string
      total:              number | undefined
      currency:           string | undefined
      idempotent:         boolean
    }

    return {
      success:           true,
      orderNumber:       result.order_number,
      confirmationToken: result.confirmation_token,
      total:             result.total,
      currency:          result.currency,
      idempotent:        result.idempotent ?? false,
    }
  } catch (err) {
    // Log server-side — sin stack trace completo al usuario
    console.error('[CHECKOUT] Unexpected exception:', err instanceof Error ? err.message : String(err))
    return { error: 'Error inesperado. Intenta nuevamente.' }
  }
}

// ─── checkoutFormAction — wrapper FormData para useActionState ────────────────

export async function checkoutFormAction(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  // Honeypot: bots rellenan este campo; usuarios no lo ven
  if (formData.get('website')) {
    return { errors: { _: 'Error de validación.' } }
  }

  const get = (k: string): string => ((formData.get(k) as string | null) ?? '').trim()

  // Idempotency key obligatoria
  const idempotencyKey = get('idempotencyKey')
  if (!idempotencyKey) {
    return { errors: { _: 'Sesión inválida. Recarga la página e intenta nuevamente.' } }
  }

  // Deserializar items: solo productId + quantity, nunca precios
  let items: { productId: string; quantity: number }[] = []
  try {
    const raw = JSON.parse(get('items')) as unknown[]
    items = raw
      .filter((i): i is { productId: string; quantity: number } =>
        typeof i === 'object' && i !== null &&
        'productId' in i && 'quantity' in i &&
        typeof (i as Record<string, unknown>).productId === 'string' &&
        typeof (i as Record<string, unknown>).quantity === 'number'
      )
      .map(i => ({ productId: i.productId, quantity: Number(i.quantity) }))
  } catch {
    return { errors: { _: 'Error al leer el carrito. Recarga la página.' } }
  }

  const input: CheckoutInput = {
    idempotencyKey,
    firstName:      get('firstName'),
    lastName:       get('lastName'),
    phone:          get('phone'),
    whatsapp:       get('whatsapp'),
    email:          get('email'),
    city:           get('city'),
    address:        get('address'),
    idNumber:       get('idNumber'),
    deliveryMethod: get('deliveryMethod') as DeliveryMethod,
    notes:          get('notes'),
    items,
    currency:       get('currency') || 'USD',
  }

  const result = await createStorefrontOrder(input)

  if ('error' in result) {
    const field = result.field ?? '_'
    return { errors: { [field]: result.error } }
  }

  return {
    success:           true,
    orderNumber:       result.orderNumber,
    confirmationToken: result.confirmationToken,
  }
}
