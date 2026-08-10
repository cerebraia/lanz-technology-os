import { createClient } from '@/lib/supabase/server'
export { PURCHASE_STATUS_LABELS } from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PurchaseOrder = {
  id:            string
  reference:     string
  supplier_name: string | null
  status:        string
  currency:      string
  subtotal:      number
  notes:         string | null
  sent_at:       string | null
  cancelled_at:  string | null
  created_at:    string
  updated_at:    string
  items:         PurchaseOrderItem[]
}

export type PurchaseOrderItem = {
  id:                string
  purchase_order_id: string
  product_id:        string
  quantity:          number
  unit_cost:         number
  total:             number
  created_at:        string
  products: {
    id:   string
    name: string
    sku:  string
  } | null
}

export type PurchaseFilters = {
  search?:  string
  status?:  string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const ITEM_SELECT = `
  id, purchase_order_id, product_id, quantity, unit_cost, total, created_at,
  products(id, name, sku)
`

export async function getPurchaseOrders(filters?: PurchaseFilters): Promise<PurchaseOrder[]> {
  const supabase = await createClient()

  let query = supabase
    .from('purchase_orders')
    .select(`
      id, reference, supplier_name, status, currency, subtotal, notes,
      sent_at, cancelled_at, created_at, updated_at,
      purchase_order_items(${ITEM_SELECT})
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener órdenes de compra: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orders = (data as any[]).map((row) => ({
    ...row,
    items: row.purchase_order_items ?? [],
  })) as PurchaseOrder[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    orders = orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(s) ||
        (o.supplier_name ?? '').toLowerCase().includes(s)
    )
  }

  return orders
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id, reference, supplier_name, status, currency, subtotal, notes,
      sent_at, cancelled_at, created_at, updated_at,
      purchase_order_items(${ITEM_SELECT})
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return { ...row, items: row.purchase_order_items ?? [] } as PurchaseOrder
}

export async function getPurchaseStats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('purchase_orders')
    .select('status, subtotal')

  if (!data) return { draft: 0, sent: 0, completed: 0, totalAmount: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[]
  return {
    draft:       rows.filter((r) => r.status === 'draft').length,
    sent:        rows.filter((r) => r.status === 'sent' || r.status === 'partially_received').length,
    completed:   rows.filter((r) => r.status === 'completed').length,
    totalAmount: rows
      .filter((r) => r.status !== 'cancelled')
      .reduce((acc, r) => acc + (r.subtotal ?? 0), 0),
  }
}
