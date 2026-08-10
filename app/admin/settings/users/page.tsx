import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getManagedUsers, ROLE_LABELS } from '@/features/users/data/users'
import { UserStatusToggle } from '@/features/users/components/user-status-toggle'
import { InviteUserForm }   from '@/features/users/components/invite-user-form'
import { PageHeader }       from '@/components/ui/page-header'
import { Badge }            from '@/components/ui/badge'
import { Card, CardBody }   from '@/components/ui/card'

export const metadata: Metadata = { title: 'Usuarios' }

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_VARIANT = {
  active:   'success',
  inactive: 'muted',
} as const

const STATUS_LABEL = {
  active:   'Activo',
  inactive: 'Inactivo',
} as const

export default async function UsersPage() {
  await verifySession()
  const canManage = await checkPermission('users.manage')
  if (!canManage) redirect('/admin/settings')

  const users = await getManagedUsers()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema y sus roles."
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Configuración', href: '/admin/settings' },
          { label: 'Usuarios' },
        ]}
      />

      {/* Invitar usuario */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Invitar nuevo usuario
          </p>
          <InviteUserForm />
        </CardBody>
      </Card>

      {/* Lista de usuarios */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                {['Usuario', 'Rol', 'Estado', 'Último acceso', 'Creado', ''].map((h, i) => (
                  <th
                    key={i}
                    className={[
                      'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted',
                      i === 0 ? 'text-left' : i === users.length - 1 ? 'text-right' : 'text-center',
                      i >= 3 ? 'hidden md:table-cell' : '',
                    ].join(' ')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-lz-border/50 last:border-0 hover:bg-lz-surface/60">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-lz-text">{user.fullName}</p>
                    <p className="text-xs text-lz-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {user.roles.length === 0
                        ? <span className="text-xs text-lz-muted">Sin rol</span>
                        : user.roles.map((r) => (
                            <Badge key={r} variant="neutral">{ROLE_LABELS[r]}</Badge>
                          ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-center text-xs text-lz-muted md:table-cell">
                    {fmtDate(user.lastSignInAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-center text-xs text-lz-muted md:table-cell">
                    {fmtDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/settings/users/${user.id}`}
                        className="rounded-lg px-2 py-1 text-xs text-lz-muted transition-colors hover:text-lz-accent"
                      >
                        Editar
                      </Link>
                      <UserStatusToggle userId={user.id} status={user.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-lz-muted">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
