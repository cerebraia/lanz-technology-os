import { createClient } from '@/lib/supabase/server'
import type { AlertPriority } from './constants'

export type SmartAlert = {
  id:          string
  type:        string
  title:       string
  description: string
  priority:    AlertPriority
  metadata:    Record<string, unknown>
}

export async function generateSmartAlerts(): Promise<SmartAlert[]> {
  const supabase = await createClient()
  const d30   = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const today = new Date().toISOString().slice(0, 10)

  const [balRes, prodRes, movRes, accRes, apRes, impRes, txRes] = await Promise.all([
    supabase.from('inventory_balances').select('product_id, on_hand'),
    supabase.from('products').select('id, name, sku, min_stock, reorder_point').is('archived_at', null),
    supabase.from('inventory_movements').select('product_id, quantity').eq('movement_type', 'sale').gte('created_at', d30),
    supabase.from('financial_accounts').select('id, name, balance, is_active'),
    supabase.from('accounts_payable').select('amount, due_date, status').eq('status', 'pending'),
    supabase
      .from('imports')
      .select('id, reference, status, estimated_arrival')
      .eq('status', 'in_transit'),
    supabase
      .from('financial_transactions')
      .select('type, amount')
      .gte('transaction_date', new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)),
  ])

  const alerts: SmartAlert[] = []
  let idx = 0
  const mkId = () => `alert-${++idx}`

  // ── Inventory alerts ────────────────────────────────────────────────────────

  const balMap: Record<string, number> = {}
  for (const b of (balRes.data ?? [])) balMap[b.product_id] = b.on_hand

  const salesMap: Record<string, number> = {}
  for (const m of (movRes.data ?? [])) salesMap[m.product_id] = (salesMap[m.product_id] ?? 0) + Math.abs(m.quantity)

  const products = prodRes.data ?? []

  const outOfStock = products.filter((p) => (balMap[p.id] ?? 0) === 0)
  if (outOfStock.length > 0) {
    alerts.push({
      id: mkId(), type: 'inventory', priority: 'critical',
      title: `${outOfStock.length} producto${outOfStock.length > 1 ? 's' : ''} agotado${outOfStock.length > 1 ? 's' : ''}`,
      description: `Sin stock: ${outOfStock.slice(0, 3).map((p) => p.name).join(', ')}${outOfStock.length > 3 ? ` y ${outOfStock.length - 3} más` : ''}.`,
      metadata: { product_ids: outOfStock.map((p) => p.id) },
    })
  }

  const lowStock = products.filter((p) => {
    const stock = balMap[p.id] ?? 0
    return stock > 0 && stock <= (p.min_stock ?? p.reorder_point ?? 0)
  })
  if (lowStock.length > 0) {
    alerts.push({
      id: mkId(), type: 'inventory', priority: 'high',
      title: `${lowStock.length} producto${lowStock.length > 1 ? 's' : ''} con bajo stock`,
      description: `Por debajo del mínimo: ${lowStock.slice(0, 3).map((p) => p.name).join(', ')}.`,
      metadata: { product_ids: lowStock.map((p) => p.id) },
    })
  }

  const noMovement = products.filter((p) => (balMap[p.id] ?? 0) > 0 && !salesMap[p.id])
  if (noMovement.length > 5) {
    alerts.push({
      id: mkId(), type: 'inventory', priority: 'medium',
      title: `${noMovement.length} productos sin ventas en 30 días`,
      description: 'Inventario inmovilizado. Considera promociones o liquidación.',
      metadata: { product_ids: noMovement.slice(0, 10).map((p) => p.id) },
    })
  }

  // ── Finance alerts ───────────────────────────────────────────────────────────

  const accounts = accRes.data ?? []
  const negativeAccounts = accounts.filter((a) => a.is_active && a.balance < 0)
  if (negativeAccounts.length > 0) {
    alerts.push({
      id: mkId(), type: 'finance', priority: 'critical',
      title: 'Saldo negativo en cuentas',
      description: `${negativeAccounts.map((a) => a.name).join(', ')} con saldo negativo.`,
      metadata: { account_ids: negativeAccounts.map((a) => a.id) },
    })
  }

  // Overdue payables
  const overduePayables = (apRes.data ?? []).filter((p) => p.due_date && p.due_date < today)
  if (overduePayables.length > 0) {
    const total = overduePayables.reduce((a, p) => a + p.amount, 0)
    alerts.push({
      id: mkId(), type: 'finance', priority: 'high',
      title: `${overduePayables.length} cuentas por pagar vencidas`,
      description: `Total vencido: USD ${total.toFixed(2)}. Regulariza el pago para evitar penalizaciones.`,
      metadata: { total, count: overduePayables.length },
    })
  }

  // Cash flow check
  const txs = txRes.data ?? []
  const income  = txs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  if (income > 0 && expense > income) {
    alerts.push({
      id: mkId(), type: 'finance', priority: 'high',
      title: 'Flujo de caja negativo este mes',
      description: `Gastos (USD ${expense.toFixed(2)}) superan ingresos (USD ${income.toFixed(2)}). Revisa la estructura de costos.`,
      metadata: { income, expense, net: income - expense },
    })
  }

  // ── Import alerts ────────────────────────────────────────────────────────────

  const imports = impRes.data ?? []
  const delayedImports = imports.filter((i) => i.estimated_arrival && i.estimated_arrival < today)
  if (delayedImports.length > 0) {
    alerts.push({
      id: mkId(), type: 'import', priority: 'high',
      title: `${delayedImports.length} importación${delayedImports.length > 1 ? 'es' : ''} con llegada retrasada`,
      description: `En tránsito: ${delayedImports.map((i) => i.reference).join(', ')}. Fecha estimada superada.`,
      metadata: { import_ids: delayedImports.map((i) => i.id) },
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      id: mkId(), type: 'general', priority: 'low',
      title: 'Todo en orden',
      description: 'No se detectaron alertas críticas en este momento.',
      metadata: {},
    })
  }

  return alerts
}
