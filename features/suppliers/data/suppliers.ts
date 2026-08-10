import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']

export type SupplierWithStats = Supplier & {
  total_orders:   number
  total_amount:   number
  last_order_at:  string | null
}

export type SupplierFilters = {
  search?:   string
  country?:  string
  isActive?: boolean | ''
}

export type SupplierStats = {
  active:      number
  inactive:    number
  totalOrders: number
  totalAmount: number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSuppliers(filters?: SupplierFilters): Promise<SupplierWithStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      *,
      purchase_orders(id, subtotal, created_at, status)
    `)
    .order('name', { ascending: true })

  if (error) throw new Error(`Error al obtener proveedores: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let suppliers: SupplierWithStats[] = (data as any[]).map((row) => {
    const orders   = (row.purchase_orders ?? []).filter((o: { status: string }) => o.status !== 'cancelled')
    const lastDate = orders.length
      ? orders.reduce((latest: string, o: { created_at: string }) =>
          o.created_at > latest ? o.created_at : latest, orders[0].created_at)
      : null

    return {
      ...row,
      purchase_orders: undefined,
      total_orders:  orders.length,
      total_amount:  orders.reduce((acc: number, o: { subtotal: number }) => acc + (o.subtotal ?? 0), 0),
      last_order_at: lastDate,
    }
  })

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    suppliers = suppliers.filter(
      (sup) =>
        sup.name.toLowerCase().includes(s) ||
        (sup.company ?? '').toLowerCase().includes(s) ||
        (sup.email ?? '').toLowerCase().includes(s)
    )
  }

  if (filters?.country) {
    suppliers = suppliers.filter((sup) => sup.country === filters.country)
  }

  if (filters?.isActive !== undefined && filters.isActive !== '') {
    suppliers = suppliers.filter((sup) => sup.is_active === filters.isActive)
  }

  return suppliers
}

export async function getSupplierById(id: string): Promise<SupplierWithStats | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      *,
      purchase_orders(id, reference, status, currency, subtotal, created_at)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row    = data as any
  const orders = (row.purchase_orders ?? []).filter((o: { status: string }) => o.status !== 'cancelled')
  const lastDate = orders.length
    ? orders.reduce((latest: string, o: { created_at: string }) =>
        o.created_at > latest ? o.created_at : latest, orders[0].created_at)
    : null

  return {
    ...row,
    purchase_orders: row.purchase_orders ?? [],
    total_orders:  orders.length,
    total_amount:  orders.reduce((acc: number, o: { subtotal: number }) => acc + (o.subtotal ?? 0), 0),
    last_order_at: lastDate,
  } as SupplierWithStats & { purchase_orders: unknown[] }
}

export async function getSupplierStats(): Promise<SupplierStats> {
  const supabase = await createClient()

  const [{ data: sups }, { data: orders }] = await Promise.all([
    supabase.from('suppliers').select('is_active'),
    supabase.from('purchase_orders').select('subtotal, status').neq('status', 'cancelled'),
  ])

  const active   = (sups ?? []).filter((s) => s.is_active).length
  const inactive = (sups ?? []).filter((s) => !s.is_active).length

  return {
    active,
    inactive,
    totalOrders: (orders ?? []).length,
    totalAmount: (orders ?? []).reduce((acc, o) => acc + (o.subtotal ?? 0), 0),
  }
}

export async function getSupplierCountries(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('suppliers').select('country').order('country')
  const unique = [...new Set((data ?? []).map((r) => r.country))].filter(Boolean)
  return unique
}

export async function getSupplierOptions(): Promise<{ value: string; label: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return (data ?? []).map((s) => ({ value: s.id, label: s.name }))
}
