import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryHold =
  Database['public']['Tables']['inventory_holds']['Row'] & {
    created_by_profile?:   { full_name: string } | null
    confirmed_by_profile?: { full_name: string } | null
    released_by_profile?:  { full_name: string } | null
  }

export type HoldItem =
  Database['public']['Tables']['inventory_hold_items']['Row'] & {
    products: { id: string; name: string; sku: string } | null
    available: number  // available at query time
  }

export type HoldWithItems = InventoryHold & { items: HoldItem[] }

export const HOLD_STATUS_LABELS: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'neutral' | 'danger' }
> = {
  pending:   { label: 'Pendiente',  variant: 'warning' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  released:  { label: 'Liberada',   variant: 'neutral' },
  expired:   { label: 'Vencida',    variant: 'danger'  },
}

export function isExpired(hold: InventoryHold): boolean {
  return (
    hold.status === 'confirmed' &&
    hold.expires_at != null &&
    new Date(hold.expires_at) < new Date()
  )
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const HOLD_SELECT = `
  *,
  created_by_profile:profiles!inventory_holds_created_by_fk(full_name),
  confirmed_by_profile:profiles!inventory_holds_confirmed_by_fk(full_name),
  released_by_profile:profiles!inventory_holds_released_by_fk(full_name)
`

export type HoldFilters = {
  status?: string
  search?: string
}

export async function getHolds(filters?: HoldFilters): Promise<InventoryHold[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventory_holds')
    .select(HOLD_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener reservas: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[]) as InventoryHold[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (h) =>
        h.reference.toLowerCase().includes(s) ||
        (h.customer_name ?? '').toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getHoldById(id: string): Promise<HoldWithItems | null> {
  const supabase = await createClient()

  // Get default location for available stock
  const { data: loc } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code')
    .limit(1)
    .single()

  const locationId = loc?.id

  const [holdResult, itemsResult] = await Promise.all([
    supabase
      .from('inventory_holds')
      .select(HOLD_SELECT)
      .eq('id', id)
      .single(),
    supabase
      .from('inventory_hold_items')
      .select('*, products(id, name, sku)')
      .eq('hold_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (holdResult.error || !holdResult.data) return null

  // Fetch available stock for each product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (itemsResult.data as any[] ?? []) as HoldItem[]

  let items = rawItems
  if (locationId && rawItems.length > 0) {
    const productIds = rawItems.map((i) => i.product_id)
    const { data: balances } = await supabase
      .from('inventory_balances')
      .select('product_id, on_hand, reserved')
      .eq('location_id', locationId)
      .in('product_id', productIds)

    const balMap: Record<string, number> = {}
    for (const b of balances ?? []) {
      balMap[b.product_id] = (b.on_hand ?? 0) - (b.reserved ?? 0)
    }

    items = rawItems.map((i) => ({
      ...i,
      available: balMap[i.product_id] ?? 0,
    }))
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(holdResult.data as any as InventoryHold),
    items,
  }
}

/** Available stock (on_hand - reserved) for a product in the default location. */
export async function getAvailableStock(productId: string): Promise<number> {
  const supabase = await createClient()

  const { data: loc } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code')
    .limit(1)
    .single()

  if (!loc) return 0

  const { data } = await supabase
    .from('inventory_balances')
    .select('on_hand, reserved')
    .eq('product_id', productId)
    .eq('location_id', loc.id)
    .single()

  return (data?.on_hand ?? 0) - (data?.reserved ?? 0)
}
