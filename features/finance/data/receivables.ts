import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type AccountReceivable = Database['public']['Tables']['accounts_receivable']['Row'] & {
  customers?: { first_name: string; last_name: string | null } | null
}

export type ReceivableFilters = { status?: string; search?: string }

export async function getReceivables(filters?: ReceivableFilters): Promise<AccountReceivable[]> {
  const supabase = await createClient()

  let query = supabase
    .from('accounts_receivable')
    .select('*, customers(first_name, last_name)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener cuentas por cobrar: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[] ?? []) as AccountReceivable[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) => {
      const clientName = r.customers
        ? `${r.customers.first_name} ${r.customers.last_name ?? ''}`.toLowerCase()
        : ''
      return r.description.toLowerCase().includes(s) || clientName.includes(s)
    })
  }

  return rows
}

export async function getReceivableStats() {
  const supabase = await createClient()
  const { data } = await supabase.from('accounts_receivable').select('status, amount')
  const rows = data ?? []
  return {
    pending:   rows.filter((r) => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0),
    overdue:   rows.filter((r) => r.status === 'overdue').reduce((acc, r) => acc + r.amount, 0),
    totalOpen: rows.filter((r) => ['pending','overdue'].includes(r.status)).reduce((acc, r) => acc + r.amount, 0),
    count:     rows.filter((r) => ['pending','overdue'].includes(r.status)).length,
  }
}
