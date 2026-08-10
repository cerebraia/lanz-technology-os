import { createClient } from '@/lib/supabase/server'

export async function getCustomersReport() {
  const supabase = await createClient()
  const now    = new Date()
  const d30    = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString()
  const d90    = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString()
  const month1 = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [custRes, orderRes, tagRes] = await Promise.all([
    supabase.from('customers').select('id, first_name, last_name, created_at, archived_at').is('archived_at', null),
    supabase.from('orders').select('id, customer_id, total_amount, created_at, status').neq('status', 'cancelled'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('customer_tag_assignments').select('customer_id, customer_tags(name)') as any),
  ])

  const customers = custRes.data   ?? []
  const orders    = orderRes.data  ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags      = (tagRes.data ?? []) as any[]

  const orderMap: Record<string, { count: number; total: number; lastDate: string }> = {}
  for (const o of orders) {
    if (!o.customer_id) continue
    if (!orderMap[o.customer_id]) orderMap[o.customer_id] = { count: 0, total: 0, lastDate: '' }
    orderMap[o.customer_id].count++
    orderMap[o.customer_id].total += o.total_amount
    if (o.created_at > orderMap[o.customer_id].lastDate) orderMap[o.customer_id].lastDate = o.created_at
  }

  const hasVipTag = (id: string) =>
    tags.some((t: { customer_id: string; customer_tags?: { name: string } | null }) =>
      t.customer_id === id && t.customer_tags?.name === 'VIP'
    )

  const newThisMonth  = customers.filter((c) => c.created_at >= month1).length
  const newLast30     = customers.filter((c) => c.created_at >= d30).length
  const vipCount      = customers.filter((c) => hasVipTag(c.id)).length
  const recurring     = customers.filter((c) => (orderMap[c.id]?.count ?? 0) >= 2).length
  const inactive      = customers.filter((c) => {
    const last = orderMap[c.id]?.lastDate
    return !last || last < d90
  }).length

  const totalRevenue = orders.reduce((a, o) => a + o.total_amount, 0)
  const avgTicket    = orders.length > 0 ? totalRevenue / orders.length : 0

  // Top customers by revenue
  const topCustomers = customers
    .map((c) => ({
      id:       c.id,
      name:     `${c.first_name} ${c.last_name ?? ''}`.trim(),
      orders:   orderMap[c.id]?.count ?? 0,
      revenue:  orderMap[c.id]?.total ?? 0,
      lastOrder: orderMap[c.id]?.lastDate ?? null,
    }))
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    totalCustomers: customers.length,
    newThisMonth,
    newLast30,
    vipCount,
    recurringCount: recurring,
    inactiveCount:  inactive,
    avgTicket,
    topCustomers,
  }
}
