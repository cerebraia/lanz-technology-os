import { createClient } from '@/lib/supabase/server'

export type EventType =
  | 'page_home' | 'page_catalog' | 'page_category' | 'page_product'
  | 'page_search' | 'page_cart' | 'page_checkout'
  | 'add_to_cart' | 'remove_from_cart'
  | 'checkout_started' | 'checkout_completed' | 'whatsapp_clicked'
  | 'error'

export type StoreEvent = {
  id:           string
  event_type:   string
  session_id:   string | null
  page_path:    string | null
  referrer:     string | null
  product_id:   string | null
  search_query: string | null
  metadata:     Record<string, unknown>
  created_at:   string
}

export type EventSummary = {
  eventType: string
  count:     number
  label:     string
}

const EVENT_LABELS: Record<string, string> = {
  page_home:           'Visitas al home',
  page_catalog:        'Visitas al catálogo',
  page_category:       'Visitas a categoría',
  page_product:        'Vistas de producto',
  page_search:         'Búsquedas',
  page_cart:           'Visitas al carrito',
  page_checkout:       'Visitas al checkout',
  add_to_cart:         'Agregar al carrito',
  remove_from_cart:    'Eliminar del carrito',
  checkout_started:    'Checkout iniciado',
  checkout_completed:  'Pedido completado',
  whatsapp_clicked:    'Clic en WhatsApp',
  error:               'Errores registrados',
}

// store_events exists in migration 031 but types haven't been regenerated yet.
// Using `any` cast is intentional and documented. Run `npm run db:types` to fix.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export async function getEventSummary(days = 30): Promise<EventSummary[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  try {
    const supabase: AnySupabase = await createClient()
    const { data } = await supabase
      .from('store_events')
      .select('event_type')
      .gte('created_at', since)

    const counts: Record<string, number> = {}
    for (const row of (data ?? []) as Array<{ event_type: string }>) {
      counts[row.event_type] = (counts[row.event_type] ?? 0) + 1
    }

    return Object.entries(EVENT_LABELS).map(([key, label]) => ({
      eventType: key,
      count:     counts[key] ?? 0,
      label,
    })).sort((a, b) => b.count - a.count)
  } catch {
    return Object.entries(EVENT_LABELS).map(([key, label]) => ({
      eventType: key, count: 0, label,
    }))
  }
}

export async function getRecentEvents(limit = 20): Promise<StoreEvent[]> {
  try {
    const supabase: AnySupabase = await createClient()
    const { data } = await supabase
      .from('store_events')
      .select('id, event_type, session_id, page_path, referrer, product_id, search_query, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as StoreEvent[]
  } catch {
    return []
  }
}

export async function getErrorEvents(limit = 20): Promise<StoreEvent[]> {
  try {
    const supabase: AnySupabase = await createClient()
    const { data } = await supabase
      .from('store_events')
      .select('id, event_type, session_id, page_path, referrer, product_id, search_query, metadata, created_at')
      .eq('event_type', 'error')
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as StoreEvent[]
  } catch {
    return []
  }
}
