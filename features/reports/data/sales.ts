import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from './period'
import { SALE_CHANNEL_LABELS, PAYMENT_METHOD_LABELS } from '@/features/orders/data/constants'

export async function getSalesReport(period = 'month', customFrom?: string, customTo?: string) {
  const { from, to, label } = getPeriodDates(period, customFrom, customTo)
  const supabase = await createClient()

  const [ordersRes, itemsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, status, total_amount, currency_code, created_at, customer_id, sale_channel, payment_method')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`),
    supabase
      .from('order_items')
      .select('product_id, product_name, product_sku, quantity, line_total, order_id'),
  ])

  const orders    = ordersRes.data ?? []
  const allItems  = itemsRes.data ?? []

  const completed  = orders.filter((o) => ['delivered', 'shipped', 'paid', 'processing', 'confirmed'].includes(o.status))
  const cancelled  = orders.filter((o) => o.status === 'cancelled')
  const revenue    = completed.reduce((a, o) => a + o.total_amount, 0)
  const avgTicket  = completed.length > 0 ? revenue / completed.length : 0

  // Sales by day
  const byDay: Record<string, number> = {}
  for (const o of completed) {
    const d = o.created_at.slice(0, 10)
    byDay[d] = (byDay[d] ?? 0) + o.total_amount
  }

  // Sales by channel
  const byChannel: Record<string, { count: number; revenue: number }> = {}
  for (const o of completed) {
    const ch = o.sale_channel ?? 'other'
    if (!byChannel[ch]) byChannel[ch] = { count: 0, revenue: 0 }
    byChannel[ch].count   += 1
    byChannel[ch].revenue += o.total_amount
  }

  // Sales by payment method
  const byPayment: Record<string, { count: number; revenue: number }> = {}
  for (const o of completed) {
    const pm = (o as { payment_method?: string | null }).payment_method ?? 'other'
    if (!byPayment[pm]) byPayment[pm] = { count: 0, revenue: 0 }
    byPayment[pm].count   += 1
    byPayment[pm].revenue += o.total_amount
  }

  // Top products by revenue
  const completedIds = new Set(completed.map((o) => o.id))
  const productMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {}
  for (const item of allItems) {
    if (!completedIds.has(item.order_id)) continue
    if (!productMap[item.product_id ?? item.product_sku]) {
      productMap[item.product_id ?? item.product_sku] = { name: item.product_name, sku: item.product_sku, qty: 0, revenue: 0 }
    }
    productMap[item.product_id ?? item.product_sku].qty     += item.quantity
    productMap[item.product_id ?? item.product_sku].revenue += item.line_total
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Daily series for chart
  const dailySeries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ label: date.slice(5), value, color: 'success' as const }))

  // Channel series for chart
  const channelSeries = Object.entries(byChannel)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([ch, d]) => ({
      label: SALE_CHANNEL_LABELS[ch] ?? ch,
      value: d.revenue,
      count: d.count,
      color: 'info' as const,
    }))

  // Payment method series
  const paymentSeries = Object.entries(byPayment)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([pm, d]) => ({
      label: PAYMENT_METHOD_LABELS[pm] ?? pm,
      value: d.revenue,
      count: d.count,
      color: 'success' as const,
    }))

  return {
    from, to, label,
    totalOrders:    orders.length,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    revenue,
    avgTicket,
    dailySeries,
    topProducts,
    channelSeries,
    paymentSeries,
  }
}
