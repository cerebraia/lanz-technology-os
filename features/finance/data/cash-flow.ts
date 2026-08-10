import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from './constants'

export type DailyCashFlow = {
  date:    string
  income:  number
  expense: number
  net:     number
}

export async function getCashFlowData(period = 'month') {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data } = await supabase
    .from('financial_transactions')
    .select('type, amount, transaction_date')
    .gte('transaction_date', from)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: true })

  const rows = data ?? []

  // Aggregate by day
  const byDay: Record<string, { income: number; expense: number }> = {}
  for (const r of rows) {
    if (!byDay[r.transaction_date]) byDay[r.transaction_date] = { income: 0, expense: 0 }
    if (r.type === 'income')  byDay[r.transaction_date].income  += r.amount
    if (r.type === 'expense') byDay[r.transaction_date].expense += r.amount
  }

  const daily: DailyCashFlow[] = Object.entries(byDay).map(([date, v]) => ({
    date,
    income:  v.income,
    expense: v.expense,
    net:     v.income - v.expense,
  }))

  const totalIncome  = rows.filter((r) => r.type === 'income').reduce((a, r) => a + r.amount, 0)
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((a, r) => a + r.amount, 0)

  return {
    daily,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    from,
    to,
  }
}
