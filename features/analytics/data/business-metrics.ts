import { createClient }  from '@/lib/supabase/server'
import { getPeriodDates } from '@/features/reports/data/period'

// ─── Revenue & Orders ─────────────────────────────────────────────────────────

export type RevenueMetrics = {
  totalOrders:    number
  completedOrders: number
  cancelledOrders: number
  revenue:        number
  avgTicket:      number
  conversionRate: number   // completed / total (excluding draft)
}

export async function getRevenueMetrics(period = 'month'): Promise<RevenueMetrics> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('status, total_amount')
    .gte('created_at', from)
    .lte('created_at', to)
    .neq('status', 'draft')

  const rows          = data ?? []
  const totalOrders   = rows.length
  const completed     = rows.filter(r => r.status === 'delivered')
  const cancelled     = rows.filter(r => ['cancelled', 'refunded'].includes(r.status))
  const revenue       = completed.reduce((s, r) => s + r.total_amount, 0)
  const avgTicket     = completed.length > 0 ? revenue / completed.length : 0
  const conversionRate = totalOrders > 0 ? (completed.length / totalOrders) * 100 : 0

  return {
    totalOrders,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    revenue,
    avgTicket,
    conversionRate,
  }
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

export type FunnelStep = { status: string; label: string; count: number; pct: number }

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pendiente confirmación',
  confirmed:            'Confirmado',
  processing:           'En procesamiento',
  preparing:            'Preparando',
  shipped:              'Enviado',
  delivered:            'Entregado',
  cancelled:            'Cancelado',
  refunded:             'Reembolsado',
}

const FUNNEL_ORDER = [
  'pending_confirmation', 'confirmed', 'processing', 'preparing', 'shipped', 'delivered',
]

export async function getOrderFunnel(period = 'month'): Promise<FunnelStep[]> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('status')
    .gte('created_at', from)
    .lte('created_at', to)
    .neq('status', 'draft')

  const rows = data ?? []
  const total = rows.length
  const counts: Record<string, number> = {}
  for (const r of rows) {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  return FUNNEL_ORDER.map(status => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    count: counts[status] ?? 0,
    pct:   total > 0 ? ((counts[status] ?? 0) / total) * 100 : 0,
  }))
}

// ─── Top products ─────────────────────────────────────────────────────────────

export type TopProduct = {
  productSku:   string
  productName:  string
  revenue:      number
  unitsSold:    number
  orderCount:   number
}

export async function getTopProducts(period = 'month', limit = 10): Promise<TopProduct[]> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .gte('created_at', from)
    .lte('created_at', to)
    .in('status', ['confirmed', 'processing', 'preparing', 'shipped', 'delivered'])

  const orderIds = (orders ?? []).map(o => o.id)
  if (orderIds.length === 0) return []

  const { data } = await supabase
    .from('order_items')
    .select('product_sku, product_name, line_total, quantity, order_id')
    .in('order_id', orderIds)

  const agg: Record<string, TopProduct> = {}
  for (const item of data ?? []) {
    const key = item.product_sku
    if (!agg[key]) {
      agg[key] = {
        productSku:  item.product_sku,
        productName: item.product_name,
        revenue:     0,
        unitsSold:   0,
        orderCount:  0,
      }
    }
    agg[key].revenue    += item.line_total
    agg[key].unitsSold  += item.quantity
    agg[key].orderCount += 1
  }

  return Object.values(agg)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// ─── Category performance ─────────────────────────────────────────────────────

export type CategoryPerformance = {
  categoryName: string
  revenue:      number
  unitsSold:    number
  orderCount:   number
}

export async function getCategoryPerformance(period = 'month'): Promise<CategoryPerformance[]> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .gte('created_at', from)
    .lte('created_at', to)
    .in('status', ['confirmed', 'processing', 'preparing', 'shipped', 'delivered'])

  const orderIds = (orders ?? []).map(o => o.id)
  if (orderIds.length === 0) return []

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name, line_total, quantity, order_id')
    .in('order_id', orderIds)

  if (!items || items.length === 0) return []

  const productIds = [...new Set(items.map(i => i.product_id).filter((id): id is string => id !== null))]

  const { data: products } = await supabase
    .from('products')
    .select('id, category_id, categories(name)')
    .in('id', productIds)

  const catMap: Record<string, string> = {}
  for (const p of products ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = (p as any).categories
    catMap[p.id] = cat?.name ?? 'Sin categoría'
  }

  const agg: Record<string, CategoryPerformance> = {}
  for (const item of items) {
    const cat = item.product_id ? (catMap[item.product_id] ?? 'Sin categoría') : 'Sin categoría'
    if (!agg[cat]) {
      agg[cat] = { categoryName: cat, revenue: 0, unitsSold: 0, orderCount: 0 }
    }
    agg[cat].revenue    += item.line_total
    agg[cat].unitsSold  += item.quantity
    agg[cat].orderCount += 1
  }

  return Object.values(agg).sort((a, b) => b.revenue - a.revenue)
}

// ─── Products never sold ──────────────────────────────────────────────────────

export type UnsoldProduct = {
  id:    string
  name:  string
  sku:   string
  price: number
}

export async function getUnsoldProducts(limit = 10): Promise<UnsoldProduct[]> {
  const supabase = await createClient()

  const { data: soldItems } = await supabase
    .from('order_items')
    .select('product_id')
    .not('product_id', 'is', null)

  const soldIds = new Set((soldItems ?? []).map(i => i.product_id).filter(Boolean))

  const { data: published } = await supabase
    .from('products')
    .select('id, name, sku, sale_price')
    .eq('is_published', true)
    .is('archived_at', null)
    .order('name')
    .limit(100)

  return (published ?? [])
    .filter(p => !soldIds.has(p.id))
    .slice(0, limit)
    .map(p => ({
      id:    p.id,
      name:  p.name,
      sku:   p.sku,
      price: p.sale_price,
    }))
}
