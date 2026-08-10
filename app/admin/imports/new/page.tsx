import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createImportAction } from '@/features/imports/actions/import-actions'
import { ImportForm } from '@/features/imports/components/import-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva importación' }

export default async function NewImportPage() {
  await verifySession()
  const canCreate = await checkPermission('imports.create')
  if (!canCreate) redirect('/admin/imports')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva importación"
        description="Registra un lote de importación para hacer seguimiento de envíos internacionales."
        breadcrumbs={[
          { label: 'Dashboard',      href: '/admin' },
          { label: 'Importaciones',  href: '/admin/imports' },
          { label: 'Nueva' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <ImportForm action={createImportAction} submitLabel="Crear importación" />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
