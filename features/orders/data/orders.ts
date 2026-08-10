import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Order     = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderStatusHistory = Database['public']['Tables']['order_status_history']['Row']

export type OrderWithRelations = Order & {
  customers?:     { first_name: string; last_name: string | null; email: string | null; phone: string | null } | null
  order_items?:   OrderItem[]
  order_status_history?: OrderStatusHistory[]
}

export type OrderFilters = {
  status?:  string
  search?:  string
  period?:  string
}

const ITEM_COLS = 'id, order_id, product_id, product_sku, product_name, unit_price, quantity, discount_amount, line_total, currency_code, created_at'

export async function getOrders(filters?: OrderFilters): Promise<OrderWithRelations[]> {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(`*, customers(first_name, last_name, email, phone)`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener pedidos: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[] ?? []) as OrderWithRelations[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) =>
      r.order_number.toLowerCase().includes(s) ||
      (r.customers ? `${r.customers.first_name} ${r.customers.last_name ?? ''}`.toLowerCase().includes(s) : false)
    )
  }

  return rows
}

export async function getOrderById(id: string): Promise<OrderWithRelations | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      customers(first_name, last_name, email, phone),
      order_items(${ITEM_COLS}),
      order_status_history(id, previous_status, new_status, notes, created_at, created_by)
    `)
    .eq('id', id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any ?? null) as OrderWithRelations | null
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('status, total_amount, created_at, payment_status')

  const rows = data ?? []
  const todayOrders   = rows.filter((r) => r.created_at >= startOfDay)
  const monthOrders   = rows.filter((r) => r.created_at >= startOfMonth && r.status !== 'cancelled' && r.status !== 'refunded')
  const pendingOrders = rows.filter((r) => ['pending', 'pending_confirmation', 'confirmed', 'processing', 'preparing'].includes(r.status))
  const shippedOrders = rows.filter((r) => r.status === 'shipped')
  const cancelledOrders = rows.filter((r) => r.status === 'cancelled')

  const monthRevenue = monthOrders.reduce((a, r) => a + r.total_amount, 0)
  const avgTicket    = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0

  return {
    todayCount:     todayOrders.length,
    monthRevenue,
    avgTicket,
    pendingCount:   pendingOrders.length,
    shippedCount:   shippedOrders.length,
    cancelledCount: cancelledOrders.length,
  }
}

export async function getProductsForOrder() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, sku, sale_price, currency_code')
    .is('archived_at', null)
    .eq('is_published', true)
    .order('name')
  return (data ?? [])
}

export async function getDefaultLocationId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code')
    .limit(1)
    .single()
  return data?.id ?? null
}
