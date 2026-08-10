'use server'

import { createClient } from '@/lib/supabase/server'
import type { EventType } from '@/features/analytics/data/store-events'

export type TrackEventInput = {
  eventType:    EventType
  sessionId?:   string
  pagePath?:    string
  referrer?:    string
  productId?:   string
  categoryId?:  string
  searchQuery?: string
  metadata?:    Record<string, string | number | boolean>
}

// store_events not yet in generated types — intentional any cast (run db:types after migration 031)
// Silent: never throws — analytics must not break the store
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient()
    await supabase.from('store_events').insert({
      event_type:   input.eventType,
      session_id:   input.sessionId  ?? null,
      page_path:    input.pagePath   ?? null,
      referrer:     input.referrer   ?? null,
      product_id:   input.productId  ?? null,
      category_id:  input.categoryId ?? null,
      search_query: input.searchQuery ?? null,
      metadata:     input.metadata   ?? {},
    })
  } catch {
    // Intentionally silent — tracking failures must not affect UX
  }
}
