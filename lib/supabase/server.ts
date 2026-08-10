import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db/database.types'

/**
 * Crea un cliente de Supabase para uso en Server Components y Server Actions.
 * Gestiona las cookies de sesión necesarias para Supabase Auth.
 *
 * Función async — usar con `await createClient()`.
 * NO usar en Client Components — usar lib/supabase/client.ts en su lugar.
 * NO exponer la service_role key desde este cliente.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local. Ver .env.example.'
    )
  }

  // cookies() es async en Next.js 15+
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components no pueden escribir cookies — solo Route Handlers
          // y Server Actions lo hacen correctamente. Este catch es esperado.
        }
      },
    },
  })
}
