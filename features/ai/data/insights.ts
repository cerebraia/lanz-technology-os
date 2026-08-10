import { createClient } from '@/lib/supabase/server'

export type InsightSummary = {
  financial: { income: number; expense: number; net: number; cashBalance: number }
  sales:     { revenue: number; orders: number; avgTicket: number }
  inventory: { totalValue: number; outOfStock: number; lowStock: number }
  imports:   { active: number; inTransit: number; logCost: number }
  opportunities: string[]
  risks:         string[]
  recommendations: string[]
}

export async function getDailyInsights(): Promise<InsightSummary> {
  const supabase = await createClient()
  const month1 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const today  = new Date().toISOString().slice(0, 10)
  const d30    = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [txRes, ordRes, balRes, prodRes, movRes, impRes, expRes, accRes] = await Promise.all([
    supabase.from('financial_transactions').select('type, amount').gte('transaction_date', month1).lte('transaction_date', today),
    supabase.from('orders').select('total_amount, status').gte('created_at', `${month1}T00:00:00`),
    supabase.from('inventory_balances').select('product_id, on_hand'),
    supabase.from('products').select('id, min_stock, reorder_point, reference_cost').is('archived_at', null),
    supabase.from('inventory_movements').select('product_id, quantity').eq('movement_type','sale').gte('created_at', d30),
    supabase.from('imports').select('status'),
    supabase.from('import_expenses').select('amount'),
    supabase.from('financial_accounts').select('balance, is_active'),
  ])

  const txs   = txRes.data  ?? []
  const ords  = ordRes.data ?? []
  const bals  = balRes.data ?? []
  const prods = prodRes.data ?? []

  const income       = txs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense      = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const cashBalance  = (accRes.data ?? []).filter((a) => a.is_active).reduce((a, acc) => a + acc.balance, 0)

  const completedOrds = ords.filter((o) => !['cancelled','draft'].includes(o.status))
  const revenue      = completedOrds.reduce((a, o) => a + o.total_amount, 0)
  const avgTicket    = completedOrds.length > 0 ? revenue / completedOrds.length : 0

  const costMap: Record<string, number> = {}
  for (const p of prods) if (p.reference_cost) costMap[p.id] = p.reference_cost
  const totalValue = bals.reduce((a, b) => a + b.on_hand * (costMap[b.product_id] ?? 0), 0)

  const balMap: Record<string, number> = {}
  for (const b of bals) balMap[b.product_id] = b.on_hand
  const outOfStock = prods.filter((p) => (balMap[p.id] ?? 0) === 0).length
  const lowStock   = prods.filter((p) => { const s = balMap[p.id] ?? 0; return s > 0 && s <= (p.min_stock ?? p.reorder_point ?? 0) }).length

  const imports   = impRes.data ?? []
  const active    = imports.filter((i) => !['received','cancelled'].includes(i.status)).length
  const inTransit = imports.filter((i) => i.status === 'in_transit').length
  const logCost   = (expRes.data ?? []).reduce((a, e) => a + e.amount, 0)

  const salesMap: Record<string, number> = {}
  for (const m of (movRes.data ?? [])) salesMap[m.product_id] = (salesMap[m.product_id] ?? 0) + Math.abs(m.quantity)
  const noMovement = prods.filter((p) => (balMap[p.id] ?? 0) > 0 && !salesMap[p.id]).length

  // Generate natural language insights
  const opportunities: string[] = []
  const risks:         string[] = []
  const recommendations: string[] = []

  if (income > expense * 1.3) opportunities.push('El margen del mes supera el 30% — considera reinvertir en inventario de alta rotación.')
  if (avgTicket > 0) opportunities.push(`Ticket promedio de USD ${avgTicket.toFixed(2)}. Estrategias de upselling pueden incrementarlo.`)
  if (noMovement > 5) opportunities.push(`${noMovement} productos sin ventas en 30 días. Una campaña de descuentos puede liberar capital inmovilizado.`)

  if (outOfStock > 0) risks.push(`${outOfStock} productos agotados pueden causar pérdida de ventas.`)
  if (expense > income) risks.push(`Flujo de caja negativo: gastos (${expense.toFixed(0)}) > ingresos (${income.toFixed(0)}). Revisa la estructura de costos.`)
  if (cashBalance < 0) risks.push(`Saldo total de cuentas negativo: USD ${cashBalance.toFixed(2)}.`)
  if (inTransit > 0 && active > inTransit) risks.push(`${active - inTransit} importación(es) activas aún no han salido. Verifica el estado con proveedores.`)

  if (lowStock > 0) recommendations.push(`Reponer ${lowStock} productos con bajo stock antes de que se agoten.`)
  if (inTransit > 0) recommendations.push(`Monitorea ${inTransit} importación(es) en tránsito para anticipar ingresos de mercancía.`)
  recommendations.push('Revisa los reportes de rentabilidad para identificar productos con mayor margen.')

  return {
    financial:  { income, expense, net: income - expense, cashBalance },
    sales:      { revenue, orders: completedOrds.length, avgTicket },
    inventory:  { totalValue, outOfStock, lowStock },
    imports:    { active, inTransit, logCost },
    opportunities,
    risks,
    recommendations,
  }
}
