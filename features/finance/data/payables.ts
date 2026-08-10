import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type AccountPayable = Database['public']['Tables']['accounts_payable']['Row'] & {
  suppliers?: { name: string } | null
}

export type PayableFilters = { status?: string; search?: string }

export async function getPayables(filters?: PayableFilters): Promise<AccountPayable[]> {
  const supabase = await createClient()

  let query = supabase
    .from('accounts_payable')
    .select('*, suppliers(name)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener cuentas por pagar: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[] ?? []) as AccountPayable[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) =>
      r.description.toLowerCase().includes(s) ||
      (r.suppliers?.name ?? '').toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getPayableStats() {
  const supabase = await createClient()
  const { data } = await supabase.from('accounts_payable').select('status, amount, currency')
  const rows = data ?? []
  return {
    pending:   rows.filter((r) => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0),
    overdue:   rows.filter((r) => r.status === 'overdue').reduce((acc, r) => acc + r.amount, 0),
    totalOpen: rows.filter((r) => ['pending','overdue'].includes(r.status)).reduce((acc, r) => acc + r.amount, 0),
    count:     rows.filter((r) => ['pending','overdue'].includes(r.status)).length,
  }
}
