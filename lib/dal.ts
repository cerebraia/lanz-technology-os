import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

type SessionUser = {
  id: string
  profile: Pick<Profile, 'id' | 'full_name' | 'status'>
}

/**
 * Verifica la sesión activa. Redirige a /login si no hay usuario autenticado.
 * Memoizada por React cache() para evitar consultas duplicadas en el mismo render.
 */
export const verifySession = cache(async (): Promise<SessionUser> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status === 'inactive') {
    await supabase.auth.signOut()
    redirect('/login')
  }

  return { id: user.id, profile }
})

/**
 * Verifica que el usuario actual tiene el permiso indicado.
 * Llama a la función has_permission() de la base de datos.
 * No redirige — retorna boolean para que el llamante decida.
 */
export const checkPermission = cache(
  async (permission: string): Promise<boolean> => {
    const supabase = await createClient()
    const { data } = await supabase.rpc('has_permission', {
      p_permission: permission,
    })
    return data === true
  }
)
