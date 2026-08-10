'use server'

import { revalidatePath }   from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient }     from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import type { UserRole }    from '@/features/users/data/constants'
import type { Database }    from '@/lib/db/database.types'

export type UserActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase Admin no configurado.')
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function requireManage() {
  await verifySession()
  const ok = await checkPermission('users.manage')
  if (!ok) throw new Error('Sin permiso para gestionar usuarios.')
}

// ─── Invite user ──────────────────────────────────────────────────────────────

export async function inviteUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  try { await requireManage() }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const session = await verifySession()

  const email    = (formData.get('email')     as string)?.trim().toLowerCase()
  const fullName = (formData.get('full_name') as string)?.trim()
  const role     = (formData.get('role')      as string) as UserRole

  const errors: Record<string, string[]> = {}
  if (!email)    errors.email     = ['El correo es requerido.']
  if (!fullName) errors.full_name = ['El nombre completo es requerido.']
  if (!['administrator', 'salesperson', 'operator'].includes(role))
                 errors.role      = ['Selecciona un rol válido.']
  if (Object.keys(errors).length) return { errors }

  const admin   = createAdminClient()
  const supabase = await createClient()

  // No puede crearse a sí mismo con rol distinto
  if (session.id) {
    const { data: existingUser } = await admin.auth.admin.getUserById(session.id)
    if (existingUser?.user?.email === email) {
      return { errors: { email: ['No puedes crear un usuario con tu propio correo.'] } }
    }
  }

  // Crear usuario via Admin API (envía email de invitación)
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { full_name: fullName },
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      return { errors: { email: ['Ya existe un usuario con este correo.'] } }
    }
    return { errors: { _: [`Error al crear usuario: ${createError.message}`] } }
  }

  const userId = newUser.user.id

  // Crear perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: userId, full_name: fullName, status: 'active' })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { errors: { _: ['Error al crear el perfil del usuario.'] } }
  }

  // Asignar rol
  const { data: roleRow } = await supabase
    .from('roles')
    .select('id')
    .eq('name', role)
    .single()

  if (!roleRow) {
    await admin.auth.admin.deleteUser(userId)
    return { errors: { _: ['Rol no encontrado en el sistema.'] } }
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleRow.id })

  if (roleError) {
    return { errors: { _: ['Usuario creado pero no se pudo asignar el rol. Asígnalo manualmente.'] } }
  }

  // Enviar magic link (invitación)
  await admin.auth.admin.generateLink({
    type:       'magiclink',
    email,
    options:    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin` },
  })

  revalidatePath('/admin/settings/users')
  return { success: true, message: `Usuario ${fullName} creado. Se enviará un enlace de acceso a ${email}.` }
}

// ─── Update user role ─────────────────────────────────────────────────────────

export async function updateUserRoleAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  try { await requireManage() }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const session  = await verifySession()
  const targetId = (formData.get('user_id') as string)?.trim()
  const role     = (formData.get('role')    as string) as UserRole

  if (!targetId) return { errors: { _: ['ID de usuario requerido.'] } }
  if (!['administrator', 'salesperson', 'operator'].includes(role))
    return { errors: { role: ['Rol inválido.'] } }

  // Un usuario no puede cambiar su propio rol a uno inferior
  if (targetId === session.id) {
    return { errors: { _: ['No puedes cambiar tu propio rol.'] } }
  }

  const supabase = await createClient()

  const { data: roleRow } = await supabase
    .from('roles')
    .select('id')
    .eq('name', role)
    .single()

  if (!roleRow) return { errors: { _: ['Rol no encontrado.'] } }

  // Eliminar roles actuales
  await supabase.from('user_roles').delete().eq('user_id', targetId)

  // Asignar nuevo rol
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: targetId, role_id: roleRow.id })

  if (error) return { errors: { _: ['Error al actualizar el rol.'] } }

  revalidatePath('/admin/settings/users')
  revalidatePath(`/admin/settings/users/${targetId}`)
  return { success: true, message: 'Rol actualizado correctamente.' }
}

// ─── Toggle user status ───────────────────────────────────────────────────────

export async function toggleUserStatusAction(
  userId:    string,
  newStatus: 'active' | 'inactive'
): Promise<{ error?: string }> {
  try { await requireManage() }
  catch (e) { return { error: (e as Error).message } }

  const session = await verifySession()
  if (userId === session.id) return { error: 'No puedes desactivar tu propia cuenta.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId)

  if (error) return { error: 'Error al actualizar el estado del usuario.' }

  if (newStatus === 'inactive') {
    const admin = createAdminClient()
    await admin.auth.admin.signOut(userId, 'global').catch(() => {})
  }

  revalidatePath('/admin/settings/users')
  return {}
}
