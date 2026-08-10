import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCategories } from '@/features/catalog/data/categories'
import { createProductAction } from '@/features/catalog/actions/product-actions'
import { ProductForm } from '@/features/catalog/components/product-form'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  await verifySession()
  const canCreate = await checkPermission('catalog.products.create')
  if (!canCreate) redirect('/admin/catalog/products')

  const categories = await getCategories()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo producto"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo', href: '/admin/catalog' },
          { label: 'Productos', href: '/admin/catalog/products' },
          { label: 'Nuevo' },
        ]}
      />

      <div className="max-w-2xl">
        <ProductForm
          action={createProductAction}
          categories={categories}
          submitLabel="Crear producto"
        />
      </div>
    </div>
  )
}
