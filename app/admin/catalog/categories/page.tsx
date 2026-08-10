import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCategories } from '@/features/catalog/data/categories'
import type { Category } from '@/features/catalog/data/categories'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { CategoryToggle } from '@/features/catalog/components/category-toggle'
import { IconPlus, IconGrid } from '@/components/icons'

export const metadata: Metadata = { title: 'Categorías' }

export default async function CategoriesPage() {
  await verifySession()
  const [canCreate, canUpdate] = await Promise.all([
    checkPermission('catalog.categories.create'),
    checkPermission('catalog.categories.update'),
  ])
  const categories = await getCategories()

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (row: Category) => (
        <div>
          <Link
            href={`/admin/catalog/categories/${row.id}`}
            className="font-medium text-lz-text transition-colors hover:text-lz-accent"
          >
            {row.name}
          </Link>
          {row.description && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-lz-muted">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      className: 'hidden sm:table-cell',
      render: (row: Category) => (
        <span className="text-xs text-lz-muted">{row.slug}</span>
      ),
    },
    {
      key: 'is_active',
      header: 'Activa',
      render: (row: Category) =>
        canUpdate ? (
          <CategoryToggle id={row.id} isActive={row.is_active} />
        ) : (
          <Badge variant={row.is_active ? 'success' : 'muted'}>
            {row.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
        ),
    },
    {
      key: 'sort_order',
      header: 'Orden',
      className: 'text-right',
      render: (row: Category) => (
        <span className="text-xs text-lz-muted">{row.sort_order}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Categorías"
        description="Organizar el catálogo en categorías"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo', href: '/admin/catalog' },
          { label: 'Categorías' },
        ]}
        actions={
          canCreate ? (
            <Link href="/admin/catalog/categories/new">
              <Button size="sm">
                <IconPlus size={14} />
                Nueva categoría
              </Button>
            </Link>
          ) : undefined
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={<IconGrid size={22} className="text-lz-muted" />}
          title="Sin categorías"
          description="Crea la primera categoría para empezar a organizar el catálogo."
          action={
            canCreate ? (
              <Link href="/admin/catalog/categories/new">
                <Button size="sm">
                  <IconPlus size={14} />
                  Nueva categoría
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={columns}
          rows={categories}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
