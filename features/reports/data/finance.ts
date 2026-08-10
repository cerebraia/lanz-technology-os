import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from './period'
import { TX_EXPENSE_CATEGORIES } from '@/features/finance/data/constants'

export async function getFinanceReport(period = 'month', customFrom?: string, customTo?: string) {
  const { from, to, label } = getPeriodDates(period, customFrom, customTo)
  const supabase = await createClient()

  const [txRes, accRes, apRes, arRes] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('type, category, amount, transaction_date')
      .gte('transaction_date', from)
      .lte('transaction_date', to),
    supabase.from('financial_accounts').select('balance, is_active, currency, type'),
    supabase.from('accounts_payable').select('amount, status, currency').in('status', ['pending','overdue']),
    supabase.from('accounts_receivable').select('amount, status, currency').in('status', ['pending','overdue']),
  ])

  const txs      = txRes.data  ?? []
  const accounts = accRes.data ?? []
  const payables  = apRes.data ?? []
  const receivables = arRes.data ?? []

  const income  = txs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const netProfit = income - expense
  const netMargin = income > 0 ? (netProfit / income) * 100 : 0

  const totalCash = accounts.filter((a) => a.is_active).reduce((a, acc) => a + acc.balance, 0)
  const totalPayables    = payables.reduce((a, p) => a + p.amount, 0)
  const totalReceivables = receivables.reduce((a, r) => a + r.amount, 0)

  // Expense by category
  const byCategory: Record<string, number> = {}
  for (const t of txs.filter((t) => t.type === 'expense')) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }
  const expenseSeries = Object.entries(byCategory)
    .sort(([,a], [,b]) => b - a)
    .map(([cat, value]) => ({ label: TX_EXPENSE_CATEGORIES[cat] ?? cat, value, color: 'danger' as const }))

  // Monthly income trend (last 6 months)
  const now = new Date()
  const monthlySeries: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-01`
    const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const mTo   = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`
    const monthIncome = txs.filter((t) => t.type === 'income' && t.transaction_date >= mFrom && t.transaction_date <= mTo).reduce((a,t) => a + t.amount, 0)
    monthlySeries.push({ label: d.toLocaleDateString('es-MX', { month: 'short' }), value: monthIncome })
  }

  return {
    from, to, label,
    income, expense, netProfit, netMargin,
    totalCash, totalPayables, totalReceivables,
    expenseSeries,
    monthlySeries: monthlySeries.map((m) => ({ ...m, color: 'success' as const })),
  }
}
