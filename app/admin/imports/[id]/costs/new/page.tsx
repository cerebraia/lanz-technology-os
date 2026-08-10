import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import { getProductsForAllocation } from '@/features/imports/data/costs'
import { CostAllocator } from '@/features/imports/components/cost-allocator'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconDollar }  from '@/components/icons'

export const metadata: Metadata = { title: 'Nueva distribución de costos' }

type Props = { params: Promise<{ id: string }> }

export default async function NewCostAllocationPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canAllocate = await checkPermission('imports.costs.allocate')
  if (!canAllocate) redirect(`/admin/imports/${id}/costs`)

  const [imp, products] = await Promise.all([
    getImportById(id),
    getProductsForAllocation(id),
  ])

  if (!imp) notFound()

  const totalLogistics = imp.total_expenses

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva distribución de costos"
        description={`Importación ${imp.reference} · Logística total: USD ${totalLogistics.toFixed(2)}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Costos',        href: `/admin/imports/${id}/costs` },
          { label: 'Nueva' },
        ]}
      />

      {totalLogistics <= 0 ? (
        <Card>
          <CardBody>
            <Alert variant="warning">
              Esta importación no tiene gastos logísticos registrados. Agrega gastos en la página de detalle antes de distribuirlos.
            </Alert>
          </CardBody>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<IconDollar size={22} className="text-lz-muted" />}
              title="Sin productos recibidos"
              description="Esta importación no tiene recepciones confirmadas. Confirma al menos una recepción antes de distribuir costos."
            />
          </CardBody>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="p-5">
            <CostAllocator
              importId={id}
              products={products}
              totalLogistics={totalLogistics}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
