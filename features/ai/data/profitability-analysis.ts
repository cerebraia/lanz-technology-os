import { createClient } from '@/lib/supabase/server'

export type ProductProfitability = {
  productId:  string
  name:       string
  sku:        string
  revenue:    number
  cost:       number
  profit:     number
  margin:     number
  unitsSold:  number
}

export type CategoryProfitability = {
  categoryId:   string | null
  categoryName: string
  revenue:      number
  profit:       number
  margin:       number
}

export async function getProfitabilityAnalysis() {
  const supabase = await createClient()
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [itemsRes, prodRes, catRes] = await Promise.all([
    supabase
      .from('order_items')
      .select('product_id, product_name, product_sku, quantity, unit_price, unit_cost, line_total')
      .gte('created_at', d30),
    supabase.from('products').select('id, name, sku, category_id, reference_cost'),
    supabase.from('categories').select('id, name'),
  ])

  const items    = itemsRes.data ?? []
  const products = prodRes.data  ?? []
  const cats     = catRes.data   ?? []

  const catMap: Record<string, string> = {}
  for (const c of cats) catMap[c.id] = c.name

  const prodMetaMap: Record<string, { categoryId: string | null; refCost: number | null }> = {}
  for (const p of products) {
    prodMetaMap[p.id] = { categoryId: p.category_id, refCost: p.reference_cost }
  }

  // Product-level aggregation
  const productMap: Record<string, ProductProfitability> = {}
  for (const item of items) {
    if (!item.product_id) continue
    const meta     = prodMetaMap[item.product_id]
    const unitCost = item.unit_cost ?? meta?.refCost ?? 0
    const cost     = unitCost * item.quantity
    const revenue  = item.line_total

    if (!productMap[item.product_id]) {
      productMap[item.product_id] = {
        productId: item.product_id,
        name:      item.product_name,
        sku:       item.product_sku,
        revenue:   0, cost: 0, profit: 0, margin: 0, unitsSold: 0,
      }
    }
    productMap[item.product_id].revenue   += revenue
    productMap[item.product_id].cost      += cost
    productMap[item.product_id].unitsSold += item.quantity
  }

  for (const p of Object.values(productMap)) {
    p.profit = p.revenue - p.cost
    p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
  }

  const sortedProducts = Object.values(productMap).sort((a, b) => b.profit - a.profit)
  const top10    = sortedProducts.slice(0, 10)
  const bottom10 = [...sortedProducts].sort((a, b) => a.margin - b.margin).slice(0, 10)
  const avgMargin = sortedProducts.length > 0
    ? sortedProducts.reduce((a, p) => a + p.margin, 0) / sortedProducts.length
    : 0

  // Category-level aggregation
  const catProfMap: Record<string, CategoryProfitability> = {}
  for (const item of items) {
    if (!item.product_id) continue
    const meta     = prodMetaMap[item.product_id]
    const catId    = meta?.categoryId ?? 'uncategorized'
    const catName  = catId !== 'uncategorized' ? (catMap[catId] ?? 'Sin categoría') : 'Sin categoría'
    const unitCost = item.unit_cost ?? meta?.refCost ?? 0
    const cost     = unitCost * item.quantity

    if (!catProfMap[catId]) {
      catProfMap[catId] = { categoryId: catId === 'uncategorized' ? null : catId, categoryName: catName, revenue: 0, profit: 0, margin: 0 }
    }
    catProfMap[catId].revenue += item.line_total
    catProfMap[catId].profit  += item.line_total - cost
  }

  for (const c of Object.values(catProfMap)) {
    c.margin = c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0
  }

  const topCategories = Object.values(catProfMap).sort((a, b) => b.profit - a.profit).slice(0, 10)

  return { top10, bottom10, avgMargin, topCategories, totalProducts: sortedProducts.length }
}
