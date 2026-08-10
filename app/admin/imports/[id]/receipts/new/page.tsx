import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import {
  getExpectedProductsForReceipt,
  getInventoryLocations,
} from '@/features/imports/data/receipts'
import { ReceiptNewForm } from '@/features/imports/components/receipt-new-form'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconPackage } from '@/components/icons'

export const metadata: Metadata = { title: 'Registrar recepción' }

type Props = { params: Promise<{ id: string }> }

export default async function NewReceiptPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canCreate = await checkPermission('imports.receipts.create')
  if (!canCreate) redirect(`/admin/imports/${id}/receipts`)

  const [imp, products, locations] = await Promise.all([
    getImportById(id),
    getExpectedProductsForReceipt(id),
    getInventoryLocations(),
  ])

  if (!imp) notFound()

  if (['received', 'cancelled', 'planning', 'purchased'].includes(imp.status)) {
    redirect(`/admin/imports/${id}`)
  }

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Registrar recepción"
        description={`Importación ${imp.reference}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Recepciones',   href: `/admin/imports/${id}/receipts` },
          { label: 'Nueva' },
        ]}
      />

      {products.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<IconPackage size={22} className="text-lz-muted" />}
              title="Sin productos pendientes"
              description="Todos los productos de esta importación han sido recibidos, o la importación no tiene órdenes de compra con productos."
            />
          </CardBody>
        </Card>
      ) : (
        <ReceiptNewForm importId={id} products={products} locations={locations} />
      )}
    </div>
  )
}
