import { createClient }  from '@/lib/supabase/server'
import { getPeriodDates } from '@/features/reports/data/period'

export type ProductProfitabilityRow = {
  productSku:  string
  productName: string
  category:    string
  unitsSold:   number
  revenue:     number
  totalCost:   number
  grossProfit: number
  margin:      number    // 0-100, NaN if no cost data
  avgPrice:    number
  avgCost:     number
  hasCostData: boolean
}

export type SortKey = 'ganancia' | 'margen' | 'volumen' | 'rendimiento'

export async function getProductProfitability(
  period = 'month',
  sort:   SortKey = 'ganancia',
  limit   = 50,
): Promise<ProductProfitabilityRow[]> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  // Get completed orders in period
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)
    .in('status', ['confirmed', 'processing', 'preparing', 'shipped', 'delivered', 'paid'])

  const orderIds = (orders ?? []).map(o => o.id)
  if (orderIds.length === 0) return []

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_sku, product_name, unit_price, unit_cost, quantity, line_total, order_id')
    .in('order_id', orderIds)

  // Get category names for products
  const productIds = [...new Set((items ?? []).map(i => i.product_id).filter(Boolean))] as string[]
  const { data: products } = await supabase
    .from('products')
    .select('id, categories(name)')
    .in('id', productIds)

  const catMap: Record<string, string> = {}
  for (const p of products ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catMap[p.id] = ((p as any).categories as { name: string } | null)?.name ?? 'Sin categoría'
  }

  // Aggregate per product
  const agg: Record<string, ProductProfitabilityRow> = {}

  for (const item of items ?? []) {
    const key = item.product_sku
    if (!agg[key]) {
      agg[key] = {
        productSku:  item.product_sku,
        productName: item.product_name,
        category:    item.product_id ? (catMap[item.product_id] ?? 'Sin categoría') : 'Sin categoría',
        unitsSold:   0,
        revenue:     0,
        totalCost:   0,
        grossProfit: 0,
        margin:      0,
        avgPrice:    0,
        avgCost:     0,
        hasCostData: false,
      }
    }
    agg[key].unitsSold += item.quantity
    agg[key].revenue   += item.line_total

    if (item.unit_cost !== null && item.unit_cost !== undefined) {
      agg[key].totalCost  += item.unit_cost * item.quantity
      agg[key].hasCostData = true
    }
  }

  // Compute derived fields
  for (const row of Object.values(agg)) {
    row.grossProfit = row.hasCostData ? row.revenue - row.totalCost : 0
    row.margin      = row.hasCostData && row.revenue > 0
      ? (row.grossProfit / row.revenue) * 100
      : NaN
    row.avgPrice    = row.unitsSold > 0 ? row.revenue / row.unitsSold : 0
    row.avgCost     = row.hasCostData && row.unitsSold > 0 ? row.totalCost / row.unitsSold : 0
  }

  const rows = Object.values(agg)

  // Sort
  const sorted = rows.sort((a, b) => {
    switch (sort) {
      case 'margen':      return (isNaN(b.margin) ? -1 : b.margin) - (isNaN(a.margin) ? -1 : a.margin)
      case 'volumen':     return b.unitsSold - a.unitsSold
      case 'rendimiento': return (isNaN(a.margin) ? 999 : a.margin) - (isNaN(b.margin) ? 999 : b.margin)
      default:            return b.grossProfit - a.grossProfit  // ganancia
    }
  })

  return sorted.slice(0, limit)
}
