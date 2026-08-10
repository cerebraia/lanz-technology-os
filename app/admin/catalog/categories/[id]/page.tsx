import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCategoryById } from '@/features/catalog/data/categories'
import { updateCategoryAction } from '@/features/catalog/actions/category-actions'
import { CategoryForm } from '@/features/catalog/components/category-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = await getCategoryById(id)
  return { title: category ? `Editar: ${category.name}` : 'Categoría' }
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canUpdate = await checkPermission('catalog.categories.update')
  if (!canUpdate) redirect('/admin/catalog/categories')

  const category = await getCategoryById(id)
  if (!category) notFound()

  const boundAction = updateCategoryAction.bind(null, id)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Editar categoría"
        description={category.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo', href: '/admin/catalog' },
          { label: 'Categorías', href: '/admin/catalog/categories' },
          { label: category.name },
        ]}
      />

      <div className="max-w-xl">
        <Card>
          <CategoryForm
            action={boundAction}
            initialData={category}
            submitLabel="Guardar cambios"
          />
        </Card>
      </div>
    </div>
  )
}
