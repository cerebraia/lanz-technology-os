import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createPurchaseOrderAction } from '@/features/purchases/actions/purchase-actions'
import { PurchaseHeaderForm } from '@/features/purchases/components/purchase-header-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva orden de compra' }

export default async function NewPurchasePage() {
  await verifySession()
  const canCreate = await checkPermission('purchases.create')
  if (!canCreate) redirect('/admin/purchases')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva orden de compra"
        description="Completa la información de la orden. Podrás agregar productos en el siguiente paso."
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Compras',    href: '/admin/purchases' },
          { label: 'Nueva orden' },
        ]}
      />

      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardBody>
            <PurchaseHeaderForm action={createPurchaseOrderAction} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
