import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getAccountById } from '@/features/finance/data/accounts'
import { ACCOUNT_TYPE_LABELS } from '@/features/finance/data/constants'
import { AccountForm }  from '@/features/finance/components/account-form'
import { PageHeader }   from '@/components/ui/page-header'
import { Badge }        from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Editar cuenta' }

type Props = { params: Promise<{ id: string }> }

export default async function EditAccountPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canManage = await checkPermission('finance.accounts.manage')
  if (!canManage) redirect('/admin/finance/accounts')

  const account = await getAccountById(id)
  if (!account) notFound()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={account.name}
        description={ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Cuentas', href: '/admin/finance/accounts' }, { label: account.name }]}
        secondaryActions={account.is_active ? <Badge variant="success">Activa</Badge> : <Badge variant="neutral">Inactiva</Badge>}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Editar cuenta</p></CardHeader>
          <CardBody><AccountForm account={account} /></CardBody>
        </Card>
      </div>
    </div>
  )
}
