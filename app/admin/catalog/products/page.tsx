import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession, checkPermission } from '@/lib/dal'
import { getProducts } from '@/features/catalog/data/products'
import { getCategories } from '@/features/catalog/data/categories'
import type { ProductWithCategory } from '@/features/catalog/data/products'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductFilters } from '@/features/catalog/components/product-filters'
import { IconPlus, IconBox } from '@/components/icons'

export const metadata: Metadata = { title: 'Productos' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number, currency: string) {
  return `${Number(price).toLocaleString('es-VE', { minimumFractionDigits: 2 })} ${currency}`
}

function computedStatusLabel(row: ProductWithCategory) {
  if (row.status === 'archived') return { label: 'Archivado', variant: 'muted'    } as const
  if (row.is_published)          return { label: 'Publicado', variant: 'success'  } as const
  if (row.status === 'active')   return { label: 'Oculto',    variant: 'warning'  } as const
  return                                { label: 'Borrador',  variant: 'neutral'  } as const
}

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key: 'name',
    header: 'Producto',
    render: (row: ProductWithCategory) => {
      const st = computedStatusLabel(row)
      return (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/catalog/products/${row.id}`}
              className="font-medium text-lz-text transition-colors hover:text-lz-accent"
            >
              {row.name}
            </Link>
            <Badge variant={st.variant}>{st.label}</Badge>
            {row.is_featured && <Badge variant="default">Destacado</Badge>}
            {row.promotional_price != null && (
              <Badge variant="warning">Oferta</Badge>
            )}
          </div>
          {row.short_description && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-lz-muted">
              {row.short_description}
            </p>
          )}
        </div>
      )
    },
  },
  {
    key: 'sku',
    header: 'SKU',
    className: 'hidden sm:table-cell',
    render: (row: ProductWithCategory) => (
      <span className="font-mono text-xs text-lz-muted">{row.sku}</span>
    ),
  },
  {
    key: 'categories',
    header: 'Categoría',
    className: 'hidden md:table-cell',
    render: (row: ProductWithCategory) => (
      <span className="text-xs text-lz-muted">{row.categories?.name ?? '—'}</span>
    ),
  },
  {
    key: 'sale_price',
    header: 'Precio',
    className: 'hidden lg:table-cell text-right',
    render: (row: ProductWithCategory) => (
      <div className="text-right">
        <p className="text-sm text-lz-text">
          {formatPrice(row.sale_price, row.currency_code)}
        </p>
        {row.promotional_price != null && (
          <p className="text-xs text-lz-warning">
            {formatPrice(row.promotional_price, row.currency_code)}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (row: ProductWithCategory) => (
      <Link
        href={`/admin/catalog/products/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Editar
      </Link>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{
    search?:    string
    status?:    string
    category?:  string
    published?: string
    promo?:     string
    page?:      string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  await verifySession()
  const canCreate = await checkPermission('catalog.products.create')

  const sp         = await searchParams
  const page       = Math.max(1, parseInt(sp.page ?? '1') || 1)
  const categories = await getCategories()

  const result = await getProducts(
    {
      search:      sp.search    || undefined,
      status:      sp.status    || undefined,
      categoryId:  sp.category  || undefined,
      isPublished: sp.published === 'true' ? true : sp.published === 'false' ? false : undefined,
      hasPromo:    sp.promo === 'true' ? true : undefined,
    },
    page
  )

  const { products, total, pages } = result

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Productos"
        description={`Gestiona el catálogo comercial de Lanz Technology${total > 0 ? ` — ${total} productos` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo', href: '/admin/catalog' },
          { label: 'Productos' },
        ]}
        actions={
          canCreate ? (
            <Link href="/admin/catalog/products/new">
              <Button size="sm">
                <IconPlus size={14} />
                Nuevo producto
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Filtros */}
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <ProductFilters categories={categories} />
      </Suspense>

      {/* Tabla */}
      {products.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Todavía no hay productos"
          description="Crea el primer producto del catálogo de Lanz Technology."
          action={
            canCreate ? (
              <Link href="/admin/catalog/products/new">
                <Button size="sm">
                  <IconPlus size={14} />
                  Crear producto
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <Table
            columns={COLUMNS}
            rows={products}
            keyExtractor={(row) => row.id}
          />

          {/* Paginación */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-xs text-lz-muted">
              <span>
                Página {page} de {pages} — {total} productos
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                    className="rounded-lg border border-lz-border bg-lz-surface px-3 py-1.5 text-lz-text transition-colors hover:border-lz-primary/50"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={`?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                    className="rounded-lg border border-lz-border bg-lz-surface px-3 py-1.5 text-lz-text transition-colors hover:border-lz-primary/50"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
