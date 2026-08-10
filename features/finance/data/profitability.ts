import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from './constants'

export type ProfitabilityData = {
  totalIncome:  number
  totalExpense: number
  grossProfit:  number
  netProfit:    number
  netMargin:    number
  roi:          number
  byCategory:   Record<string, number>
  from:         string
  to:           string
}

export async function getProfitabilityData(period = 'month'): Promise<ProfitabilityData> {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data } = await supabase
    .from('financial_transactions')
    .select('type, category, amount')
    .gte('transaction_date', from)
    .lte('transaction_date', to)

  const rows = data ?? []

  const totalIncome  = rows.filter((r) => r.type === 'income').reduce((a, r) => a + r.amount, 0)
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((a, r) => a + r.amount, 0)
  const grossProfit  = totalIncome - totalExpense
  const netProfit    = grossProfit
  const netMargin    = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
  const roi          = totalExpense > 0 ? ((netProfit / totalExpense) * 100) : 0

  const byCategory: Record<string, number> = {}
  for (const r of rows.filter((r) => r.type === 'expense')) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount
  }

  return { totalIncome, totalExpense, grossProfit, netProfit, netMargin, roi, byCategory, from, to }
}
