import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Customer = Database['public']['Tables']['customers']['Row']

export type CustomerWithTags = Customer & {
  customer_tag_assignments?: { customer_tags: { id: string; name: string; color: string } | null }[]
}

export type CustomerFilters = {
  search?: string
  tag?:    string
}

export async function getCustomers(filters?: CustomerFilters): Promise<CustomerWithTags[]> {
  const supabase = await createClient()

  const query = supabase
    .from('customers')
    .select('*, customer_tag_assignments(customer_tags(id, name, color))')
    .is('archived_at', null)
    .order('first_name')

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener clientes: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[] ?? []) as CustomerWithTags[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter((r) => {
      const fullName = `${r.first_name} ${r.last_name ?? ''}`.toLowerCase()
      return fullName.includes(s) || (r.email ?? '').toLowerCase().includes(s) || (r.phone ?? '').includes(s) || (r.company ?? '').toLowerCase().includes(s)
    })
  }

  if (filters?.tag) {
    rows = rows.filter((r) =>
      r.customer_tag_assignments?.some((a) => a.customer_tags?.name === filters.tag)
    )
  }

  return rows
}

export async function getCustomerById(id: string): Promise<CustomerWithTags | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('*, customer_tag_assignments(customer_tags(id, name, color))')
    .eq('id', id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any ?? null) as CustomerWithTags | null
}

export async function getCustomerStats(customerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('customer_id', customerId)
    .neq('status', 'cancelled')

  const orders = data ?? []
  const totalSpent  = orders.reduce((a, o) => a + o.total_amount, 0)
  const orderCount  = orders.length
  const avgTicket   = orderCount > 0 ? totalSpent / orderCount : 0
  const lastOrder   = orders.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.created_at ?? null

  return { totalSpent, orderCount, avgTicket, lastOrder }
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, created_at, archived_at, customer_tag_assignments(customer_tags(name))')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[] ?? [])
  const now       = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const active  = rows.filter((r) => !r.archived_at).length
  const newThisMonth = rows.filter((r) => !r.archived_at && r.created_at >= thisMonth).length
  const vip     = rows.filter((r) =>
    !r.archived_at &&
    r.customer_tag_assignments?.some((a: { customer_tags?: { name: string } | null }) => a.customer_tags?.name === 'VIP')
  ).length

  return { active, newThisMonth, vip, total: rows.length }
}
