import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createCategoryAction } from '@/features/catalog/actions/category-actions'
import { CategoryForm } from '@/features/catalog/components/category-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva categoría' }

export default async function NewCategoryPage() {
  await verifySession()
  const canCreate = await checkPermission('catalog.categories.create')
  if (!canCreate) redirect('/admin/catalog/categories')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva categoría"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo', href: '/admin/catalog' },
          { label: 'Categorías', href: '/admin/catalog/categories' },
          { label: 'Nueva' },
        ]}
      />

      <div className="max-w-xl">
        <Card>
          <CategoryForm action={createCategoryAction} submitLabel="Crear categoría" />
        </Card>
      </div>
    </div>
  )
}
