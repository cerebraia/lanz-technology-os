import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryEntry = {
  id:          string
  product_id:  string
  location_id: string
  on_hand:     number
  reserved:    number
  available:   number
  updated_at:  string
  products: {
    id:         string
    name:       string
    sku:        string
    min_stock:  number
    status:     string
    brand:      string | null
    categories: { id: string; name: string } | null
  }
  inventory_locations: {
    id:   string
    name: string
    code: string
  }
}

export type StockStatus = 'out' | 'low' | 'ok'

export function getStockStatus(available: number, minStock: number): StockStatus {
  if (available <= 0)          return 'out'
  if (available <= minStock)   return 'low'
  return 'ok'
}

export type InventoryMovementRow = {
  id:              string
  product_id:      string
  location_id:     string
  movement_type:   string
  quantity:        number
  quantity_before: number
  quantity_after:  number
  reason:          string | null
  notes:           string | null
  reference_type:  string | null
  reference_id:    string | null
  created_at:      string
  inventory_locations: { name: string; code: string } | null
  profiles:            { full_name: string }        | null
  products:            { id: string; name: string; sku: string } | null
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  opening_balance:  'Saldo inicial',
  purchase_receipt: 'Entrada — compra',
  import_receipt:   'Entrada — importación',
  sale:             'Salida — venta',
  return_in:        'Devolución (entrada)',
  return_out:       'Devolución (salida)',
  adjustment_in:    'Ajuste (entrada)',
  adjustment_out:   'Ajuste (salida)',
  transfer_in:      'Transferencia (entrada)',
  transfer_out:     'Transferencia (salida)',
  damage:           'Merma / daño',
  loss:             'Pérdida',
  reservation:      'Reserva',
  release:          'Liberación de reserva',
}

export const MOVEMENT_TYPE_OPTIONS = Object.entries(MOVEMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)

// ─── Inventory balance queries ────────────────────────────────────────────────

export type InventoryFilters = {
  search?:    string
  categoryId?: string
  stock?:     StockStatus | ''
}

export async function getInventoryList(filters?: InventoryFilters): Promise<InventoryEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      id, product_id, location_id, on_hand, reserved, updated_at,
      products!inner(id, name, sku, min_stock, status, brand, categories(id, name)),
      inventory_locations(id, name, code)
    `)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Error al obtener inventario: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entries = (data as any[]).map((row) => ({
    ...row,
    available: row.on_hand - row.reserved,
  })) as InventoryEntry[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    entries = entries.filter(
      (e) =>
        e.products.name.toLowerCase().includes(s) ||
        e.products.sku.toLowerCase().includes(s)
    )
  }

  if (filters?.categoryId) {
    entries = entries.filter((e) => e.products.categories?.id === filters.categoryId)
  }

  if (filters?.stock === 'out') {
    entries = entries.filter((e) => e.available <= 0)
  } else if (filters?.stock === 'low') {
    entries = entries.filter(
      (e) => e.available > 0 && e.available <= e.products.min_stock
    )
  } else if (filters?.stock === 'ok') {
    entries = entries.filter((e) => e.available > e.products.min_stock)
  }

  return entries
}

export async function getInventoryByProductId(productId: string): Promise<InventoryEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_balances')
    .select(`
      id, product_id, location_id, on_hand, reserved, updated_at,
      products!inner(id, name, sku, min_stock, status, brand, categories(id, name)),
      inventory_locations(id, name, code)
    `)
    .eq('product_id', productId)

  if (error || !data || data.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    ...row,
    available: row.on_hand - row.reserved,
  })) as InventoryEntry[]
}

export async function getInventoryStats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_balances')
    .select('on_hand, reserved, products!inner(min_stock)')

  if (!data) return { total: 0, outOfStock: 0, lowStock: 0, ok: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries    = data as any[]
  const total      = entries.length
  const outOfStock = entries.filter((e) => e.on_hand - e.reserved <= 0).length
  const lowStock   = entries.filter(
    (e) => e.on_hand - e.reserved > 0 && e.on_hand - e.reserved <= e.products.min_stock
  ).length
  const ok = total - outOfStock - lowStock

  return { total, outOfStock, lowStock, ok }
}

// ─── Movement queries ─────────────────────────────────────────────────────────

export type MovementFilters = {
  search?:       string
  movementType?: string
  dateFrom?:     string
  dateTo?:       string
  productId?:    string
  referenceId?:  string
}

const MOVEMENT_SELECT = `
  id, product_id, location_id, movement_type,
  quantity, quantity_before, quantity_after,
  reason, notes, reference_type, reference_id, created_at,
  inventory_locations(name, code),
  profiles(full_name),
  products(id, name, sku)
`

export async function getInventoryMovements(
  productId: string,
  limit = 50
): Promise<InventoryMovementRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select(MOVEMENT_SELECT)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Error al obtener movimientos: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]) as InventoryMovementRow[]
}

export async function getMovementsFiltered(
  filters?: MovementFilters,
  limit = 100
): Promise<InventoryMovementRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventory_movements')
    .select(MOVEMENT_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.movementType) query = query.eq('movement_type', filters.movementType)
  if (filters?.productId)    query = query.eq('product_id', filters.productId)
  if (filters?.referenceId)  query = query.eq('reference_id', filters.referenceId)
  if (filters?.dateFrom)     query = query.gte('created_at', filters.dateFrom)
  if (filters?.dateTo) {
    // Include the full last day
    const to = new Date(filters.dateTo)
    to.setDate(to.getDate() + 1)
    query = query.lt('created_at', to.toISOString())
  }

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener movimientos: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[]) as InventoryMovementRow[]

  // Post-fetch search by product name/SKU (can't filter embedded easily server-side)
  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.products?.name.toLowerCase().includes(s) ||
        r.products?.sku.toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getMovementById(id: string): Promise<InventoryMovementRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select(MOVEMENT_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any as InventoryMovementRow
}
