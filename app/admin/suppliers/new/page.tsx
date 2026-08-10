import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createSupplierAction } from '@/features/suppliers/actions/supplier-actions'
import { SupplierForm } from '@/features/suppliers/components/supplier-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nuevo proveedor' }

export default async function NewSupplierPage() {
  await verifySession()
  const canCreate = await checkPermission('suppliers.create')
  if (!canCreate) redirect('/admin/suppliers')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo proveedor"
        description="Registra un proveedor para vincularlo a órdenes de compra e importaciones."
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Compras',     href: '/admin/purchases' },
          { label: 'Proveedores', href: '/admin/suppliers' },
          { label: 'Nuevo' },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        <Card padding={false}>
          <CardBody>
            <SupplierForm action={createSupplierAction} submitLabel="Crear proveedor" />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
