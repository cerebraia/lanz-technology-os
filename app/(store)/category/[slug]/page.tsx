import type { Metadata } from 'next'
import { cache }    from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductCard }       from '@/components/store/product-card'
import { CatalogFilters }    from '@/components/store/catalog-filters'
import { CatalogPagination } from '@/components/store/catalog-pagination'
import { StoreEmptyState }   from '@/components/store/store-empty-state'
import { getPublishedProducts, getDistinctBrands } from '@/features/store/data/products'
import { getPublicCategoryBySlug, getPublicCategories } from '@/features/store/data/categories'
import type { StoreSort } from '@/features/store/data/products'

type Props = {
  params:       Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

const PAGE_SIZE = 24
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

// cache() deduplica la query entre generateMetadata y la función page()
const getCategory = cache(getPublicCategoryBySlug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug }   = await params
  const category   = await getCategory(slug)

  if (!category) {
    return { title: 'Categoría no encontrada' }
  }

  const description = category.description ?? `Explora ${category.name} en Lanz Technology.`

  return {
    title:       category.name,   // template añade "— Lanz Technology"
    description,
    alternates:  { canonical: `${SITE_URL}/category/${slug}` },
    openGraph: {
      title:       `${category.name} — Lanz Technology`,
      description,
      url:         `${SITE_URL}/category/${slug}`,
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${category.name} — Lanz Technology`,
      description,
    },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp       = await searchParams

  // Validate category
  const [category, categories, brands] = await Promise.all([
    getCategory(slug),
    getPublicCategories(),
    getDistinctBrands(),
  ])

  // 404 if category doesn't exist or is inactive
  if (!category) notFound()

  const sort  = (sp.sort as StoreSort) || 'featured'
  const page  = Math.max(1, parseInt(sp.page ?? '1') || 1)

  const { products, total } = await getPublishedProducts(
    {
      categorySlug: slug,
      brand:        sp.brand ?? undefined,
      sale:         sp.sale === 'true' ? true : undefined,
      sort,
    },
    page,
    PAGE_SIZE
  )

  const pages          = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = !!(sp.brand || sp.sale)

  return (
    <div className="animate-page">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-lz-border bg-lz-surface/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-lz-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-lz-text transition-colors">Inicio</Link>
            <span aria-hidden>/</span>
            <Link href="/catalog" className="hover:text-lz-text transition-colors">Catálogo</Link>
            <span aria-hidden>/</span>
            <span className="text-lz-text">{category.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-lz-text sm:text-3xl">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-lz-muted">{category.description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters — category pre-selected, hidden from the selector */}
        <div className="mb-6">
          <CatalogFilters
            categories={categories}
            brands={brands}
            currentCategory={slug}
            currentBrand={sp.brand}
            currentSort={sort}
            currentSale={sp.sale === 'true'}
            total={total}
            hasActiveFilters={hasActiveFilters}
            clearHref={`/category/${slug}`}
            formAction={`/category/${slug}`}
          />
        </div>

        {products.length === 0 ? (
          <StoreEmptyState
            icon="box"
            title="Sin productos en esta categoría"
            description={
              hasActiveFilters
                ? 'Prueba quitando los filtros aplicados.'
                : 'Esta categoría no tiene productos publicados todavía.'
            }
            cta={{ label: 'Ver catálogo completo', href: '/catalog' }}
          />
        ) : (
          <>
            <p className="mb-5 hidden text-xs text-lz-muted lg:block">
              {total} producto{total !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
            <CatalogPagination page={page} pages={pages} searchParams={{ ...sp, category: slug }} />
          </>
        )}
      </div>
    </div>
  )
}
