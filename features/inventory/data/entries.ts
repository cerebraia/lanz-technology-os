import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryEntry = Database['public']['Tables']['inventory_entries']['Row'] & {
  created_by_profile?:   { full_name: string } | null
  confirmed_by_profile?: { full_name: string } | null
  cancelled_by_profile?: { full_name: string } | null
}

export type EntryItem = Database['public']['Tables']['inventory_entry_items']['Row'] & {
  products: { id: string; name: string; sku: string } | null
}

export type EntryWithItems = InventoryEntry & { items: EntryItem[] }

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  purchase:   'Compra local',
  import:     'Importación',
  return:     'Devolución',
  adjustment: 'Ajuste positivo',
}

export const ENTRY_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'danger' }> = {
  draft:     { label: 'Borrador',   variant: 'neutral'  },
  confirmed: { label: 'Confirmada', variant: 'success'  },
  cancelled: { label: 'Cancelada',  variant: 'danger'   },
}

export const ENTRY_TYPE_OPTIONS = Object.entries(ENTRY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)

// ─── Queries ──────────────────────────────────────────────────────────────────

const ENTRY_SELECT = `
  *,
  created_by_profile:profiles!inventory_entries_created_by_fk(full_name),
  confirmed_by_profile:profiles!inventory_entries_confirmed_by_fk(full_name),
  cancelled_by_profile:profiles!inventory_entries_cancelled_by_fk(full_name)
`

export type EntryFilters = {
  status?:    string
  entryType?: string
  search?:    string
}

export async function getEntries(filters?: EntryFilters): Promise<InventoryEntry[]> {
  const supabase = await createClient()

  let query = supabase
    .from('inventory_entries')
    .select(ENTRY_SELECT)
    .order('created_at', { ascending: false })

  if (filters?.status)    query = query.eq('status', filters.status)
  if (filters?.entryType) query = query.eq('entry_type', filters.entryType)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener entradas: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = (data as any[]) as InventoryEntry[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    rows = rows.filter(
      (e) =>
        e.reference.toLowerCase().includes(s) ||
        (e.supplier_name ?? '').toLowerCase().includes(s)
    )
  }

  return rows
}

export async function getEntryById(id: string): Promise<EntryWithItems | null> {
  const supabase = await createClient()

  const [entryResult, itemsResult] = await Promise.all([
    supabase
      .from('inventory_entries')
      .select(ENTRY_SELECT)
      .eq('id', id)
      .single(),
    supabase
      .from('inventory_entry_items')
      .select('*, products(id, name, sku)')
      .eq('inventory_entry_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (entryResult.error || !entryResult.data) return null

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(entryResult.data as any as InventoryEntry),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (itemsResult.data as any[] ?? []) as EntryItem[],
  }
}
