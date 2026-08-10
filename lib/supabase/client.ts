'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/db/database.types'

/**
 * Crea un cliente de Supabase para uso en Client Components.
 * Usa la publishable key (anon key) junto con RLS para proteger los datos.
 *
 * NO usar para operaciones que requieran la service_role key.
 * NO llamar en Server Components — usar lib/supabase/server.ts en su lugar.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local. Ver .env.example.'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}
