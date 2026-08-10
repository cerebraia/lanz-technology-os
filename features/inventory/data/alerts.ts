import { createClient } from '@/lib/supabase/server'
import { getInventoryMovements, type InventoryMovementRow } from './inventory'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertStatus = 'out_of_stock' | 'critical' | 'low_stock' | 'in_stock'

export type AlertEntry = {
  product_id:       string
  product_name:     string
  sku:              string
  category_name:    string | null
  available:        number
  on_hand:          number
  reserved:         number
  min_stock:        number
  reorder_point:    number
  reorder_quantity: number
  status:           AlertStatus
}

export type AlertFilters = {
  search?:     string
  categoryId?: string
  status?:     AlertStatus | ''
}

export type AlertStats = {
  outOfStock:     number
  lowStock:       number
  critical:       number
  unitsToReorder: number
}

export type AlertDetail = AlertEntry & {
  movements: InventoryMovementRow[]
}

// ─── Status logic ─────────────────────────────────────────────────────────────

export function getAlertStatus(
  available:    number,
  minStock:     number,
  reorderPoint: number,
): AlertStatus {
  if (available <= 0)            return 'out_of_stock'
  if (available <= reorderPoint) return 'critical'
  if (available <= minStock)     return 'low_stock'
  return 'in_stock'
}

export function getAlertRecommendation(entry: AlertEntry): string {
  if (entry.status === 'out_of_stock') return 'Producto agotado. Reposición urgente.'
  if (entry.status === 'critical')     return `Inventario crítico. Se recomienda reponer ${entry.reorder_quantity > 0 ? entry.reorder_quantity : 'unidades a definir'} unidades.`
  if (entry.status === 'low_stock')    return `Stock por debajo del mínimo. Se recomienda reponer ${entry.reorder_quantity > 0 ? entry.reorder_quantity : 'unidades a definir'} unidades.`
  return 'No requiere reposición.'
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const ALERT_SELECT = `
  product_id, on_hand, reserved,
  products!inner(
    id, name, sku, min_stock, reorder_point, reorder_quantity, track_inventory,
    categories(id, name)
  )
`

export async function getAlerts(filters?: AlertFilters): Promise<AlertEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_balances')
    .select(ALERT_SELECT)
    .order('on_hand', { ascending: true })

  if (error) throw new Error(`Error al obtener alertas: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entries: AlertEntry[] = (data as any[]).map((row) => {
    const p         = row.products
    const available = row.on_hand - row.reserved
    return {
      product_id:       p.id,
      product_name:     p.name,
      sku:              p.sku,
      category_name:    p.categories?.name ?? null,
      available,
      on_hand:          row.on_hand,
      reserved:         row.reserved,
      min_stock:        p.min_stock,
      reorder_point:    p.reorder_point,
      reorder_quantity: p.reorder_quantity,
      status:           getAlertStatus(available, p.min_stock, p.reorder_point),
    }
  })

  // Exclude in_stock by default for the alerts view — only show items needing attention
  // unless no status filter is applied, then show all non-in_stock items
  if (!filters?.status) {
    entries = entries.filter((e) => e.status !== 'in_stock')
  }

  if (filters?.status) {
    entries = entries.filter((e) => e.status === filters.status)
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    entries = entries.filter(
      (e) =>
        e.product_name.toLowerCase().includes(s) ||
        e.sku.toLowerCase().includes(s)
    )
  }

  if (filters?.categoryId) {
    entries = entries.filter((e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (data as any[]).find((r) => r.products.id === e.product_id)
      return raw?.products?.categories?.id === filters.categoryId
    })
  }

  return entries
}

export async function getAlertStats(): Promise<AlertStats> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('inventory_balances')
    .select('on_hand, reserved, products!inner(min_stock, reorder_point, reorder_quantity)')

  if (!data) return { outOfStock: 0, lowStock: 0, critical: 0, unitsToReorder: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = data as any[]
  let outOfStock     = 0
  let lowStock       = 0
  let critical       = 0
  let unitsToReorder = 0

  for (const row of entries) {
    const available = row.on_hand - row.reserved
    const status    = getAlertStatus(available, row.products.min_stock, row.products.reorder_point)
    if (status === 'out_of_stock') { outOfStock++;     unitsToReorder += row.products.reorder_quantity }
    if (status === 'critical')     { critical++;       unitsToReorder += row.products.reorder_quantity }
    if (status === 'low_stock')    { lowStock++;       unitsToReorder += row.products.reorder_quantity }
  }

  return { outOfStock, lowStock, critical, unitsToReorder }
}

export async function getAlertByProductId(productId: string): Promise<AlertDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_balances')
    .select(ALERT_SELECT)
    .eq('product_id', productId)
    .single()

  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row       = data as any
  const p         = row.products
  const available = row.on_hand - row.reserved
  const entry: AlertEntry = {
    product_id:       p.id,
    product_name:     p.name,
    sku:              p.sku,
    category_name:    p.categories?.name ?? null,
    available,
    on_hand:          row.on_hand,
    reserved:         row.reserved,
    min_stock:        p.min_stock,
    reorder_point:    p.reorder_point,
    reorder_quantity: p.reorder_quantity,
    status:           getAlertStatus(available, p.min_stock, p.reorder_point),
  }

  const movements = await getInventoryMovements(productId, 10)

  return { ...entry, movements }
}
