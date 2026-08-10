'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Tipos públicos de la confirmación ────────────────────────────────────────
// Nunca expone unit_cost, reference_cost ni IDs internos.

export type ConfirmationItem = {
  product_name: string
  product_sku:  string
  quantity:     number
  unit_price:   number
  line_total:   number
  currency:     string
}

export type OrderConfirmationData = {
  order_number:    string
  status:          string
  payment_status:  string
  currency:        string
  subtotal:        number
  total:           number
  delivery_method: string | null
  notes:           string | null
  created_at:      string
  customer_name:   string
  customer_phone:  string | null
  customer_city:   string | null
  items:           ConfirmationItem[]
}

export async function getOrderConfirmation(
  orderNumber: string,
  token:       string
): Promise<OrderConfirmationData | null> {
  if (!orderNumber || !token) return null

  // Validación básica del token (UUID v4 format)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(token)) return null

  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_storefront_order_confirmation', {
      p_order_number:  orderNumber,
      p_confirm_token: token,
    })

    if (error || !data) return null
    return data as OrderConfirmationData
  } catch {
    return null
  }
}
