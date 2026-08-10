import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { ReceivableForm } from '@/features/finance/components/receivable-form'
import { PageHeader }     from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nuevo cobro pendiente' }

export default async function NewReceivablePage() {
  await verifySession()
  const canManage = await checkPermission('finance.receivables.manage')
  if (!canManage) redirect('/admin/finance/receivables')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo cobro pendiente"
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Finanzas',   href: '/admin/finance' },
          { label: 'Por cobrar', href: '/admin/finance/receivables' },
          { label: 'Nuevo' },
        ]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardBody>
            <ReceivableForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
