import { createClient } from '@/lib/supabase/server'

export const PAGE_SIZE = 25

export type SaleFilters = {
  status?:         string
  sale_channel?:   string
  payment_method?: string
  search?:         string
  date_from?:      string
  date_to?:        string
  page?:           number
}

export type SaleRow = {
  id:             string
  order_number:   string
  created_at:     string
  status:         string
  payment_status: string
  sale_channel:   string
  payment_method: string | null
  total_amount:   number
  currency_code:  string
  notes:          string | null
  customers: {
    first_name: string
    last_name:  string | null
    phone:      string | null
    email:      string | null
  } | null
}

export type SaleDetail = {
  id:             string
  order_number:   string
  created_at:     string
  updated_at:     string
  status:         string
  payment_status: string
  sale_channel:   string
  payment_method: string | null
  total_amount:   number
  subtotal:       number
  discount_amount: number
  shipping:       number
  taxes:          number
  currency_code:  string
  notes:          string | null
  cancelled_at:   string | null
  cancel_reason:  string | null
  created_by:     string | null
  customers: {
    id:        string
    first_name: string
    last_name:  string | null
    phone:      string | null
    email:      string | null
    address:    string | null
    notes:      string | null
  } | null
  order_items: {
    id:             string
    order_id:       string
    product_id:     string | null
    product_sku:    string
    product_name:   string
    unit_price:     number
    quantity:       number
    discount_amount: number
    line_total:     number
    currency_code:  string
    created_at:     string
  }[]
  order_status_history: {
    id:              string
    previous_status: string | null
    new_status:      string
    notes:           string | null
    created_at:      string
    created_by:      string | null
  }[]
}

export async function getSalesList(
  filters: SaleFilters
): Promise<{ rows: SaleRow[]; count: number; page: number; totalPages: number }> {
  const supabase = await createClient()
  const page     = Math.max(1, filters.page ?? 1)
  const from     = (page - 1) * PAGE_SIZE
  const to       = from + PAGE_SIZE - 1

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, created_at, status, payment_status, sale_channel, payment_method, total_amount, currency_code, notes, customers(first_name, last_name, phone, email)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status)         query = query.eq('status', filters.status)
  if (filters.sale_channel)   query = query.eq('sale_channel', filters.sale_channel)
  if (filters.payment_method) query = query.eq('payment_method', filters.payment_method)
  if (filters.date_from)      query = query.gte('created_at', filters.date_from)
  if (filters.date_to)        query = query.lte('created_at', filters.date_to)

  const { data, error, count } = await query
  if (error) throw new Error(`Error al obtener ventas: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[] ?? []) as SaleRow[]

  if (filters.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) =>
      r.order_number.toLowerCase().includes(s) ||
      (r.customers
        ? `${r.customers.first_name} ${r.customers.last_name ?? ''}`.toLowerCase().includes(s)
        : false) ||
      (r.customers?.phone ?? '').toLowerCase().includes(s)
    )
  }

  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return { rows, count: total, page, totalPages }
}

export async function getSaleById(id: string): Promise<SaleDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      *,
      customers(id, first_name, last_name, phone, email, address, notes),
      order_items(id, order_id, product_id, product_sku, product_name, unit_price, quantity, discount_amount, line_total, currency_code, created_at),
      order_status_history(id, previous_status, new_status, notes, created_at, created_by)
    `)
    .eq('id', id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any ?? null) as SaleDetail | null
}

type ChannelStat = { count: number; revenue: number }

export async function getSalesDashboardStats() {
  const supabase    = await createClient()
  const now         = new Date()
  const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data } = await supabase
    .from('orders')
    .select('status, total_amount, created_at, sale_channel')

  const rows = data ?? []
  const INACTIVE = ['cancelled', 'refunded', 'draft']

  const todayOrders    = rows.filter((r) => r.created_at >= startOfDay && !INACTIVE.includes(r.status))
  const monthOrders    = rows.filter((r) => r.created_at >= startOfMonth && !INACTIVE.includes(r.status))
  const pendingOrders  = rows.filter((r) => ['pending', 'pending_confirmation', 'confirmed', 'processing', 'preparing'].includes(r.status))
  const deliveredOrders = rows.filter((r) => r.status === 'delivered')
  const cancelledOrders = rows.filter((r) => r.status === 'cancelled')

  const todayRevenue = todayOrders.reduce((a, r) => a + r.total_amount, 0)
  const monthRevenue = monthOrders.reduce((a, r) => a + r.total_amount, 0)
  const avgTicket    = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0

  const byChannel: Record<string, ChannelStat> = {}
  for (const r of rows) {
    if (INACTIVE.includes(r.status)) continue
    const ch = r.sale_channel ?? 'other'
    if (!byChannel[ch]) byChannel[ch] = { count: 0, revenue: 0 }
    byChannel[ch].count   += 1
    byChannel[ch].revenue += r.total_amount
  }

  return {
    todayCount:     todayOrders.length,
    todayRevenue,
    monthRevenue,
    avgTicket,
    pendingCount:   pendingOrders.length,
    deliveredCount: deliveredOrders.length,
    cancelledCount: cancelledOrders.length,
    byChannel,
  }
}
