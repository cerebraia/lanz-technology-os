/**
 * Cliente Supabase para el catálogo público de la tienda.
 *
 * Usa la publishable key (anon) + RLS de migration 009.
 * Las políticas RLS garantizan que el rol anon solo lea productos publicados,
 * categorías activas e imágenes de productos públicos.
 *
 * Los filtros explícitos en cada query (.eq('is_published', true), etc.) son
 * defensa en profundidad y no sustituyen a la RLS.
 *
 * NUNCA usar service_role en este módulo — no es necesario y no está disponible
 * en todos los entornos (Railway solo expone variables NEXT_PUBLIC_ al runtime).
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

export function createStoreClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Ver .env.example para configuración.'
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
