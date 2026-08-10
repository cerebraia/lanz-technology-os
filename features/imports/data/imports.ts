import { createClient } from '@/lib/supabase/server'
export type { ImportStatus } from './constants'
export {
  IMPORT_STATUS_LABELS,
  IMPORT_STATUS_STAGES,
  SHIPPING_METHOD_LABELS,
  EXPENSE_CONCEPT_LABELS,
} from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportExpense = {
  id:         string
  import_id:  string
  concept:    string
  amount:     number
  currency:   string
  notes:      string | null
  created_at: string
}

export type ImportPurchaseOrder = {
  id:                string
  import_id:         string
  purchase_order_id: string
  created_at:        string
  purchase_orders: {
    id:            string
    reference:     string
    supplier_name: string | null
    currency:      string
    subtotal:      number
    status:        string
    suppliers: { name: string } | null
  } | null
}

export type Import = {
  id:                  string
  reference:           string
  status:              string
  origin_country:      string
  destination_country: string
  shipping_method:     string | null
  estimated_departure: string | null
  estimated_arrival:   string | null
  actual_arrival:      string | null
  notes:               string | null
  created_by:          string | null
  created_at:          string
  updated_at:          string
}

export type ImportDetail = Import & {
  expenses:       ImportExpense[]
  linked_orders:  ImportPurchaseOrder[]
  total_expenses: number
  total_merch:    number
}

export type ImportFilters = {
  search?: string
  status?: string
}

export type ImportStats = {
  active:     number
  inTransit:  number
  logCost:    number
  completed:  number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getImports(filters?: ImportFilters): Promise<Import[]> {
  const supabase = await createClient()

  let query = supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener importaciones: ${error.message}`)

  let rows = (data ?? []) as Import[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.reference.toLowerCase().includes(s) ||
        r.origin_country.toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getImportById(id: string): Promise<ImportDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  const [{ data: expenses }, { data: linkedOrders }] = await Promise.all([
    supabase
      .from('import_expenses')
      .select('*')
      .eq('import_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('import_purchase_orders')
      .select(`
        id, import_id, purchase_order_id, created_at,
        purchase_orders(id, reference, supplier_name, currency, subtotal, status, suppliers(name))
      `)
      .eq('import_id', id),
  ])

  const expList = (expenses ?? []) as ImportExpense[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderList = (linkedOrders as any[] ?? []) as ImportPurchaseOrder[]

  const total_expenses = expList.reduce((acc, e) => acc + e.amount, 0)
  const total_merch    = orderList.reduce(
    (acc, o) => acc + (o.purchase_orders?.subtotal ?? 0), 0
  )

  return {
    ...(data as Import),
    expenses:      expList,
    linked_orders: orderList,
    total_expenses,
    total_merch,
  }
}

export async function getImportStats(): Promise<ImportStats> {
  const supabase = await createClient()

  const [{ data: imps }, { data: exps }] = await Promise.all([
    supabase.from('imports').select('status'),
    supabase.from('import_expenses').select('amount'),
  ])

  const rows = imps ?? []
  return {
    active:    rows.filter((r) => !['received', 'cancelled'].includes(r.status)).length,
    inTransit: rows.filter((r) => r.status === 'in_transit').length,
    logCost:   (exps ?? []).reduce((acc, e) => acc + e.amount, 0),
    completed: rows.filter((r) => r.status === 'received').length,
  }
}

export async function getAvailablePurchaseOrders() {
  const supabase = await createClient()

  // Orders not already linked to an import
  const { data: linked } = await supabase
    .from('import_purchase_orders')
    .select('purchase_order_id')

  const linkedIds = (linked ?? []).map((r) => r.purchase_order_id)

  let query = supabase
    .from('purchase_orders')
    .select('id, reference, supplier_name, subtotal, currency')
    .in('status', ['sent', 'partially_received'])
    .order('created_at', { ascending: false })

  if (linkedIds.length > 0) {
    query = query.not('id', 'in', `(${linkedIds.join(',')})`)
  }

  const { data } = await query
  return (data ?? []).map((o) => ({
    value: o.id,
    label: `${o.reference}${o.supplier_name ? ` — ${o.supplier_name}` : ''} (${o.currency} ${o.subtotal.toFixed(2)})`,
  }))
}
