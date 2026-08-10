import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { AccountForm } from '@/features/finance/components/account-form'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva cuenta financiera' }

export default async function NewAccountPage() {
  await verifySession()
  const canManage = await checkPermission('finance.accounts.manage')
  if (!canManage) redirect('/admin/finance/accounts')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva cuenta financiera"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Cuentas', href: '/admin/finance/accounts' }, { label: 'Nueva' }]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}><CardBody><AccountForm /></CardBody></Card>
      </div>
    </div>
  )
}
