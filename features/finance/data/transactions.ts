import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'
import { getPeriodDates } from './constants'

export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row']

export type TransactionFilters = {
  type?:     string
  category?: string
  period?:   string
  dateFrom?: string
  dateTo?:   string
  search?:   string
}

export async function getTransactions(filters?: TransactionFilters, limit = 100): Promise<FinancialTransaction[]> {
  const supabase = await createClient()

  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.type)     query = query.eq('type', filters.type)
  if (filters?.category) query = query.eq('category', filters.category)

  const { from, to } = filters?.period
    ? getPeriodDates(filters.period)
    : { from: filters?.dateFrom, to: filters?.dateTo }

  if (from) query = query.gte('transaction_date', from)
  if (to)   query = query.lte('transaction_date', to)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener transacciones: ${error.message}`)

  let rows = (data ?? []) as FinancialTransaction[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) => r.description.toLowerCase().includes(s))
  }

  return rows
}

export async function getTransactionSummary(period = 'month') {
  const { from, to } = getPeriodDates(period)
  const supabase = await createClient()

  const { data } = await supabase
    .from('financial_transactions')
    .select('type, category, amount')
    .gte('transaction_date', from)
    .lte('transaction_date', to)

  const rows = data ?? []
  const income  = rows.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0)
  const expense = rows.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0)

  const byCategory: Record<string, number> = {}
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount
  }

  return { income, expense, net: income - expense, byCategory, period, from, to }
}

export async function getMonthlyTrend(months = 6) {
  const supabase = await createClient()
  const now = new Date()

  const results: { month: string; income: number; expense: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d      = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const from   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const last   = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const to     = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
    const label  = d.toLocaleDateString('es-MX', { month: 'short' })

    const { data } = await supabase
      .from('financial_transactions')
      .select('type, amount')
      .gte('transaction_date', from)
      .lte('transaction_date', to)

    const rows    = data ?? []
    const income  = rows.filter((r) => r.type === 'income').reduce((acc, r) => acc + r.amount, 0)
    const expense = rows.filter((r) => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0)
    results.push({ month: label, income, expense })
  }

  return results
}
