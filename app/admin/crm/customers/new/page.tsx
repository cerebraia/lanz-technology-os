import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { CustomerForm } from '@/features/crm/components/customer-form'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nuevo cliente' }

export default async function NewCustomerPage() {
  await verifySession()
  const canCreate = await checkPermission('crm.create')
  if (!canCreate) redirect('/admin/crm/customers')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo cliente"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'CRM',       href: '/admin/crm' },
          { label: 'Clientes',  href: '/admin/crm/customers' },
          { label: 'Nuevo' },
        ]}
      />
      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <CustomerForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
