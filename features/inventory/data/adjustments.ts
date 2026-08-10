import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryAdjustment =
  Database['public']['Tables']['inventory_adjustments']['Row'] & {
    created_by_profile?:   { full_name: string } | null
    confirmed_by_profile?: { full_name: string } | null
    cancelled_by_profile?: { full_name: string } | null
  }

export type AdjustmentItem =
  Database['public']['Tables']['inventory_adjustment_items']['Row'] & {
    products: { id: string; name: string; sku: string } | null
  }

export type AdjustmentWithItems = InventoryAdjustment & {
  items: AdjustmentItem[]
}

export const ADJUSTMENT_STATUS_LABELS: Record<
  string,
  { label: string; variant: 'neutral' | 'success' | 'danger' }
> = {
  draft:     { label: 'Borrador',   variant: 'neutral'  },
  confirmed: { label: 'Confirmado', variant: 'success'  },
  cancelled: { label: 'Cancelado',  variant: 'danger'   },
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const ADJ_SELECT = `
  *,
  created_by_profile:profiles!inventory_adjustments_created_by_fk(full_name),
  confirmed_by_profile:profiles!inventory_adjustments_confirmed_by_fk(full_name),
  cancelled_by_profile:profiles!inventory_adjustments_cancelled_by_fk(full_name)
`

export type AdjustmentFilters = {
  status?: string
  search?: string
}

export async function getAdjustments(
  filters?: AdjustmentFilters
): Promise<InventoryAdjustment[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventory_adjustments')
    .select(ADJ_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener ajustes: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[]) as InventoryAdjustment[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (a) =>
        a.reference.toLowerCase().includes(s) ||
        a.reason.toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getAdjustmentById(
  id: string
): Promise<AdjustmentWithItems | null> {
  const supabase = await createClient()

  const [adjResult, itemsResult] = await Promise.all([
    supabase
      .from('inventory_adjustments')
      .select(ADJ_SELECT)
      .eq('id', id)
      .single(),
    supabase
      .from('inventory_adjustment_items')
      .select('*, products(id, name, sku)')
      .eq('inventory_adjustment_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (adjResult.error || !adjResult.data) return null

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(adjResult.data as any as InventoryAdjustment),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (itemsResult.data as any[] ?? []) as AdjustmentItem[],
  }
}

/** Obtiene el on_hand actual de un producto en la ubicación activa. */
export async function getCurrentStockForProduct(
  productId: string
): Promise<number> {
  const supabase = await createClient()

  // Obtener ubicación activa por defecto
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
    .select('on_hand')
    .eq('product_id', productId)
    .eq('location_id', loc.id)
    .single()

  return data?.on_hand ?? 0
}
