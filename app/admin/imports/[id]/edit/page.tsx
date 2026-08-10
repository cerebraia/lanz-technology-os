import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import { updateImportAction } from '@/features/imports/actions/import-actions'
import { ImportForm } from '@/features/imports/components/import-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Editar importación' }

type Props = { params: Promise<{ id: string }> }

export default async function EditImportPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canUpdate = await checkPermission('imports.update')
  if (!canUpdate) redirect('/admin/imports')

  const imp = await getImportById(id)
  if (!imp) notFound()

  if (['received', 'cancelled'].includes(imp.status)) redirect(`/admin/imports/${id}`)

  const boundAction = updateImportAction.bind(null, id)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={`Editar — ${imp.reference}`}
        description="Modifica los datos generales de la importación."
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Editar' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <ImportForm action={boundAction} imp={imp} submitLabel="Guardar cambios" />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
