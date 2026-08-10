import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getManagedUserById, ROLE_LABELS } from '@/features/users/data/users'
import { UserStatusToggle }  from '@/features/users/components/user-status-toggle'
import { UpdateRoleForm }    from '@/features/users/components/update-role-form'
import { PageHeader }        from '@/components/ui/page-header'
import { Badge }             from '@/components/ui/badge'
import { Card, CardBody }    from '@/components/ui/card'
import { Alert }             from '@/components/ui/alert'

export const metadata: Metadata = { title: 'Editar usuario' }

type Props = { params: Promise<{ id: string }> }

function fmtDate(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canManage = await checkPermission('users.manage')
  if (!canManage) redirect('/admin/settings')

  const user = await getManagedUserById(id)
  if (!user) notFound()

  const session = await verifySession()
  const isSelf  = session.id === user.id

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={user.fullName}
        description={user.email}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Configuración', href: '/admin/settings' },
          { label: 'Usuarios',      href: '/admin/settings/users' },
          { label: user.fullName },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            <Badge variant={user.status === 'active' ? 'success' : 'muted'}>
              {user.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
            {user.roles.map((r) => (
              <Badge key={r} variant="neutral">{ROLE_LABELS[r]}</Badge>
            ))}
          </div>
        }
      />

      <div className="mx-auto max-w-lg space-y-6">
        {/* Información */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-lz-text">Información</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-lz-muted">Correo</dt>
              <dd className="font-medium text-lz-text">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-lz-muted">Último acceso</dt>
              <dd className="text-lz-muted">{fmtDate(user.lastSignInAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-lz-muted">Creado</dt>
              <dd className="text-lz-muted">{fmtDate(user.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        {/* Rol */}
        <Card padding={false}>
          <CardBody>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">Rol</p>
            {isSelf ? (
              <Alert variant="info">No puedes cambiar tu propio rol.</Alert>
            ) : (
              <UpdateRoleForm
                userId={user.id}
                currentRole={user.roles[0] ?? 'salesperson'}
              />
            )}
          </CardBody>
        </Card>

        {/* Estado */}
        {!isSelf && (
          <Card>
            <p className="mb-3 text-sm font-semibold text-lz-text">Estado de la cuenta</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-lz-muted">
                {user.status === 'active'
                  ? 'El usuario puede iniciar sesión normalmente.'
                  : 'El usuario no puede iniciar sesión.'}
              </p>
              <UserStatusToggle userId={user.id} status={user.status} />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
