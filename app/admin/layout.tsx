import type { Metadata } from 'next'
import { verifySession }  from '@/lib/dal'
import { signOut }        from '@/features/auth/actions/sign-out'
import { createClient }   from '@/lib/supabase/server'
import { AdminShell }     from '@/components/admin/shell'
import type { NavRole }   from '@/components/layout/sidebar'

export const metadata: Metadata = {
  title: {
    template: '%s — Lanz Technology OS',
    default:  'Centro de operaciones — Lanz Technology OS',
  },
  robots: 'noindex, nofollow',
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

async function getUserRoles(userId: string): Promise<NavRole[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r) => (r.roles as any)?.name as NavRole).filter(Boolean)
  } catch {
    return []
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session  = await verifySession()
  const userRoles = await getUserRoles(session.id)

  return (
    <AdminShell
      user={{
        fullName: session.profile.full_name,
        initials: getInitials(session.profile.full_name),
      }}
      userRoles={userRoles}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  )
}
