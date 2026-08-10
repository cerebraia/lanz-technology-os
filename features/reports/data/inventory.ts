import { createClient } from '@/lib/supabase/server'

export async function getInventoryReport() {
  const supabase = await createClient()

  const [balRes, prodRes, movRes] = await Promise.all([
    supabase.from('inventory_balances').select('product_id, on_hand, reserved'),
    supabase.from('products').select('id, name, sku, sale_price, reference_cost, min_stock, reorder_point, archived_at').is('archived_at', null),
    // Last 30 days movements
    supabase.from('inventory_movements')
      .select('product_id, movement_type, quantity, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .in('movement_type', ['sale', 'purchase_receipt', 'import_receipt']),
  ])

  const balances  = balRes.data  ?? []
  const products  = prodRes.data ?? []
  const movements = movRes.data  ?? []

  const balanceMap: Record<string, { on_hand: number; reserved: number }> = {}
  for (const b of balances) {
    balanceMap[b.product_id] = { on_hand: b.on_hand, reserved: b.reserved }
  }

  const salesMap: Record<string, number> = {}
  for (const m of movements) {
    if (m.movement_type === 'sale') {
      salesMap[m.product_id] = (salesMap[m.product_id] ?? 0) + Math.abs(m.quantity)
    }
  }

  const rows = products.map((p) => {
    const bal     = balanceMap[p.id] ?? { on_hand: 0, reserved: 0 }
    const sales30 = salesMap[p.id] ?? 0
    const value   = bal.on_hand * (p.reference_cost ?? p.sale_price)
    const coverage = sales30 > 0 ? (bal.on_hand / (sales30 / 30)) : null // days coverage

    return {
      id:        p.id,
      name:      p.name,
      sku:       p.sku,
      on_hand:   bal.on_hand,
      reserved:  bal.reserved,
      available: bal.on_hand - bal.reserved,
      min_stock: p.min_stock,
      reorder:   p.reorder_point,
      value,
      sales30,
      coverage,
    }
  })

  const totalValue     = rows.reduce((a, r) => a + r.value, 0)
  const outOfStock     = rows.filter((r) => r.on_hand === 0)
  const lowStock       = rows.filter((r) => r.on_hand > 0 && r.on_hand <= r.min_stock)
  const highRotation   = rows.filter((r) => r.sales30 > 0).sort((a, b) => b.sales30 - a.sales30).slice(0, 10)
  const noMovement     = rows.filter((r) => r.sales30 === 0 && r.on_hand > 0)

  const avgCoverage = rows
    .filter((r) => r.coverage !== null)
    .reduce((a, r, _, arr) => a + (r.coverage ?? 0) / arr.length, 0)

  return {
    totalProducts:  rows.length,
    totalValue,
    outOfStockCount: outOfStock.length,
    lowStockCount:   lowStock.length,
    avgCoverage,
    outOfStock,
    lowStock,
    highRotation,
    noMovement: noMovement.slice(0, 10),
    allRows: rows,
  }
}
