import { createClient } from '@/lib/supabase/server'
import type { RiskLevel } from './constants'

export type InventoryPrediction = {
  productId:    string
  name:         string
  sku:          string
  onHand:       number
  avgDailySales: number
  daysRemaining: number | null
  stockoutDate:  string | null
  risk:          RiskLevel
}

function estimatedStockoutDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + Math.round(days))
  return d.toISOString().slice(0, 10)
}

export async function getInventoryPredictions(): Promise<InventoryPrediction[]> {
  const supabase = await createClient()
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [balRes, prodRes, movRes] = await Promise.all([
    supabase.from('inventory_balances').select('product_id, on_hand, reserved'),
    supabase.from('products').select('id, name, sku, min_stock, reorder_point').is('archived_at', null),
    supabase
      .from('inventory_movements')
      .select('product_id, quantity')
      .eq('movement_type', 'sale')
      .gte('created_at', d30),
  ])

  const balMap: Record<string, { on_hand: number; reserved: number }> = {}
  for (const b of (balRes.data ?? [])) balMap[b.product_id] = b

  const salesMap: Record<string, number> = {}
  for (const m of (movRes.data ?? [])) {
    salesMap[m.product_id] = (salesMap[m.product_id] ?? 0) + Math.abs(m.quantity)
  }

  const predictions: InventoryPrediction[] = []

  for (const p of (prodRes.data ?? [])) {
    const bal          = balMap[p.id] ?? { on_hand: 0, reserved: 0 }
    const available    = bal.on_hand - bal.reserved
    const sold30       = salesMap[p.id] ?? 0
    const avgDailySales = sold30 / 30

    let daysRemaining: number | null = null
    let stockoutDate:  string | null = null
    let risk: RiskLevel = 'normal'

    if (avgDailySales > 0) {
      daysRemaining = available / avgDailySales
      stockoutDate  = estimatedStockoutDate(daysRemaining)

      if (daysRemaining <= 7)  risk = 'critical'
      else if (daysRemaining <= 21) risk = 'attention'
    } else if (available === 0) {
      daysRemaining = 0
      risk = 'critical'
    }

    // Only include products with some activity or low stock
    if (risk !== 'normal' || available <= (p.reorder_point ?? 0)) {
      predictions.push({
        productId:    p.id,
        name:         p.name,
        sku:          p.sku,
        onHand:       bal.on_hand,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysRemaining: daysRemaining !== null ? Math.round(daysRemaining) : null,
        stockoutDate,
        risk,
      })
    }
  }

  return predictions.sort((a, b) => {
    const order: Record<RiskLevel, number> = { critical: 0, attention: 1, normal: 2 }
    return order[a.risk] - order[b.risk]
  })
}
