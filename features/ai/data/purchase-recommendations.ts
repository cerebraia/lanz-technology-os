import { createClient } from '@/lib/supabase/server'

export type PurchaseRecommendation = {
  productId:        string
  name:             string
  sku:              string
  currentStock:     number
  reorderPoint:     number
  reorderQuantity:  number
  avgDailySales:    number
  daysToStockout:   number | null
  estimatedCost:    number | null
  confidence:       number
  reason:           string
}

export async function getPurchaseRecommendations(): Promise<PurchaseRecommendation[]> {
  const supabase = await createClient()
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [balRes, prodRes, movRes, poiRes] = await Promise.all([
    supabase.from('inventory_balances').select('product_id, on_hand, reserved'),
    supabase.from('products').select('id, name, sku, min_stock, reorder_point, reorder_quantity, reference_cost').is('archived_at', null),
    supabase.from('inventory_movements').select('product_id, quantity').eq('movement_type', 'sale').gte('created_at', d30),
    // Active purchase order items to avoid double-ordering
    supabase.from('purchase_order_items').select('product_id, quantity'),
  ])

  const balMap: Record<string, number> = {}
  for (const b of (balRes.data ?? [])) balMap[b.product_id] = b.on_hand - b.reserved

  const salesMap: Record<string, number> = {}
  for (const m of (movRes.data ?? [])) {
    salesMap[m.product_id] = (salesMap[m.product_id] ?? 0) + Math.abs(m.quantity)
  }

  const pendingPoMap: Record<string, number> = {}
  for (const i of (poiRes.data ?? [])) {
    pendingPoMap[i.product_id] = (pendingPoMap[i.product_id] ?? 0) + i.quantity
  }

  const recs: PurchaseRecommendation[] = []

  for (const p of (prodRes.data ?? [])) {
    const available   = balMap[p.id] ?? 0
    const pending     = pendingPoMap[p.id] ?? 0
    const sold30      = salesMap[p.id] ?? 0
    const dailyRate   = sold30 / 30
    const reorderPt   = p.reorder_point ?? 0
    const reorderQty  = p.reorder_quantity ?? 1

    // Skip if already covered by pending orders
    if (available + pending > reorderPt * 2) continue

    // Trigger: available at or below reorder point
    if (available > reorderPt) continue

    const daysToStockout = dailyRate > 0 ? Math.round(available / dailyRate) : null
    const estimatedCost  = p.reference_cost ? p.reference_cost * reorderQty : null

    let confidence = 0.5
    let reason = 'Stock por debajo del punto de reorden.'

    if (available === 0) {
      confidence = 1.0
      reason = 'Producto agotado — pedido urgente.'
    } else if (daysToStockout !== null && daysToStockout <= 7) {
      confidence = 0.95
      reason = `Se agotará en ~${daysToStockout} días con la rotación actual.`
    } else if (dailyRate > 0) {
      confidence = 0.75
      reason = `Rotación de ${dailyRate.toFixed(1)} uds/día. Stock actual cubre ${daysToStockout} días.`
    }

    recs.push({
      productId:       p.id,
      name:            p.name,
      sku:             p.sku,
      currentStock:    available,
      reorderPoint:    reorderPt,
      reorderQuantity: reorderQty,
      avgDailySales:   Math.round(dailyRate * 100) / 100,
      daysToStockout,
      estimatedCost,
      confidence,
      reason,
    })
  }

  return recs.sort((a, b) => b.confidence - a.confidence)
}
