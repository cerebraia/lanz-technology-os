import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row']

export async function getAccounts(onlyActive?: boolean): Promise<FinancialAccount[]> {
  const supabase = await createClient()
  let query = supabase.from('financial_accounts').select('*').order('name')
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw new Error(`Error al obtener cuentas: ${error.message}`)
  return (data ?? []) as FinancialAccount[]
}

export async function getAccountById(id: string): Promise<FinancialAccount | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('financial_accounts').select('*').eq('id', id).single()
  return (data ?? null) as FinancialAccount | null
}

export async function getAccountStats() {
  const accounts = await getAccounts()
  return {
    total:     accounts.length,
    active:    accounts.filter((a) => a.is_active).length,
    totalCash: accounts.filter((a) => a.is_active).reduce((acc, a) => acc + a.balance, 0),
  }
}

export function getAccountOptions(accounts: FinancialAccount[]) {
  return [
    { value: '', label: 'Sin cuenta asignada' },
    ...accounts.filter((a) => a.is_active).map((a) => ({
      value: a.id,
      label: `${a.name} (${a.currency} ${a.balance.toFixed(2)})`,
    })),
  ]
}
