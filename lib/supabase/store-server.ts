/**
 * Cliente Supabase para el catálogo público de la tienda.
 *
 * Usa service_role, que bypassa TODA RLS — incluyendo migration 009.
 * Es seguro porque:
 *   - SUPABASE_SERVICE_ROLE_KEY es server-only (sin NEXT_PUBLIC_)
 *   - Este módulo solo se importa en Server Components
 *   - Cada query aplica los mismos filtros que la RLS de migration 009:
 *     is_published=true, status='active', archived_at IS NULL, published_at IS NOT NULL
 *
 * IMPORTANTE: agregar estos filtros a cualquier query nueva en este módulo.
 * Si se elimina service_role, usar createClient() y los filtros RLS de migration 009
 * aplicarán automáticamente para el rol `anon`.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

export function createStoreClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. ' +
      'Ver .env.example para configuración.'
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
