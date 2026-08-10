import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { PayableForm }  from '@/features/finance/components/payable-form'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva cuenta por pagar' }

export default async function NewPayablePage() {
  await verifySession()
  const canManage = await checkPermission('finance.payables.manage')
  if (!canManage) redirect('/admin/finance/payables')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva cuenta por pagar"
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Finanzas',    href: '/admin/finance' },
          { label: 'Por pagar',   href: '/admin/finance/payables' },
          { label: 'Nueva' },
        ]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardBody>
            <PayableForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
