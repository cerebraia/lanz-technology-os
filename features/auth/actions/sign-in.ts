'use server'

import { createClient } from '@/lib/supabase/server'

export type SignInState =
  | { error: string; field?: 'email' | 'password' | 'general' }
  | { success: true; redirectTo: string }
  | undefined

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || !email.trim()) {
    return { error: 'El correo es obligatorio.', field: 'email' }
  }

  if (typeof password !== 'string' || !password) {
    return { error: 'La contraseña es obligatoria.', field: 'password' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    // No exponer detalles técnicos del error al usuario
    return {
      error: 'Correo o contraseña incorrectos.',
      field: 'general',
    }
  }

  // Verificar que el perfil existe y está activo
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No se pudo iniciar sesión. Intenta nuevamente.', field: 'general' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta no tiene un perfil configurado. Contacta al administrador.',
      field: 'general',
    }
  }

  if (profile.status === 'inactive') {
    await supabase.auth.signOut()
    return {
      error: 'Tu cuenta está inactiva. Contacta al administrador.',
      field: 'general',
    }
  }

  // Devolver éxito — el Client Component maneja la navegación.
  // Usar redirect() dentro del Server Action provoca que Next.js renderice
  // /admin como RSC payload en la misma respuesta, antes de que las cookies
  // de sesión estén disponibles en ese contexto, generando un 404.
  return { success: true, redirectTo: '/admin' }
}
