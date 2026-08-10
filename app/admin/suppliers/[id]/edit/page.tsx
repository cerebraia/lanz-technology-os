import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSupplierById } from '@/features/suppliers/data/suppliers'
import { updateSupplierAction } from '@/features/suppliers/actions/supplier-actions'
import { SupplierForm } from '@/features/suppliers/components/supplier-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Editar proveedor' }

type Props = { params: Promise<{ id: string }> }

export default async function EditSupplierPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canUpdate = await checkPermission('suppliers.update')
  if (!canUpdate) redirect('/admin/suppliers')

  const supplier = await getSupplierById(id)
  if (!supplier) notFound()

  const boundAction = updateSupplierAction.bind(null, id)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={`Editar — ${supplier.name}`}
        description="Modifica los datos del proveedor."
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Compras',     href: '/admin/purchases' },
          { label: 'Proveedores', href: '/admin/suppliers' },
          { label: supplier.name, href: `/admin/suppliers/${id}` },
          { label: 'Editar' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <SupplierForm
              action={boundAction}
              supplier={supplier}
              submitLabel="Guardar cambios"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
