import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'
import type { UserRole } from '@/features/users/data/constants'
export type { UserRole }      from '@/features/users/data/constants'
export { ROLE_LABELS, ROLE_OPTIONS } from '@/features/users/data/constants'

export type ManagedUser = {
  id:           string
  email:        string
  fullName:     string
  status:       'active' | 'inactive'
  roles:        UserRole[]
  lastSignInAt: string | null
  createdAt:    string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase Admin no configurado.')
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const admin = createAdminClient()
  const supabase = await createClient()

  // Auth users (last sign in, email)
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1, perPage: 200,
  })
  if (authError) throw new Error(`Error al listar usuarios: ${authError.message}`)

  const authUsers = authData.users

  // Profiles + roles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, status')

  if (profileError) throw new Error(`Error al cargar perfiles: ${profileError.message}`)

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id, roles(name)')

  const rolesMap = new Map<string, UserRole[]>()
  for (const ur of userRoles ?? []) {
    const existing = rolesMap.get(ur.user_id) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (ur.roles as any)?.name as UserRole | undefined
    if (roleName) existing.push(roleName)
    rolesMap.set(ur.user_id, existing)
  }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  return authUsers
    .filter((u) => profileMap.has(u.id))
    .map((u) => {
      const profile = profileMap.get(u.id)!
      return {
        id:           u.id,
        email:        u.email ?? '',
        fullName:     profile.full_name,
        status:       profile.status as 'active' | 'inactive',
        roles:        rolesMap.get(u.id) ?? [],
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt:    u.created_at,
      }
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export async function getManagedUserById(id: string): Promise<ManagedUser | null> {
  const users = await getManagedUsers()
  return users.find((u) => u.id === id) ?? null
}
