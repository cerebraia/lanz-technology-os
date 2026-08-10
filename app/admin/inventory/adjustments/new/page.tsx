import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createAdjustmentAction } from '@/features/inventory/actions/adjustment-actions'
import { AdjustmentHeaderForm } from '@/features/inventory/components/adjustment-header-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nuevo ajuste' }

export default async function NewAdjustmentPage() {
  await verifySession()
  const canCreate = await checkPermission('inventory.adjustments.create')
  if (!canCreate) redirect('/admin/inventory/adjustments')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo ajuste de inventario"
        description="Paso 1 de 2 — Define la referencia y motivo. Luego agrega los productos con su conteo físico."
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Ajustes',    href: '/admin/inventory/adjustments' },
          { label: 'Nuevo' },
        ]}
      />

      <div className="max-w-xl">
        <Card>
          <AdjustmentHeaderForm action={createAdjustmentAction} />
        </Card>
      </div>
    </div>
  )
}
