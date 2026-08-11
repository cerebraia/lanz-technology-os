import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard }        from '@/components/store/product-card'
import { CatalogFilters }     from '@/components/store/catalog-filters'
import { CatalogPagination }  from '@/components/store/catalog-pagination'
import { StoreEmptyState }    from '@/components/store/store-empty-state'
import { getPublishedProducts, getDistinctBrands } from '@/features/store/data/products'
import { getPublicCategories } from '@/features/store/data/categories'
import type { StoreProductFilters, StoreSort } from '@/features/store/data/products'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

export const metadata: Metadata = {
  title:       'Catálogo',
  description: 'Explora productos DJI, cámaras, micrófonos, estabilizadores y accesorios premium seleccionados por Lanz Technology. Tecnología para creadores en Venezuela.',
  alternates:  { canonical: `${SITE_URL}/catalog` },
  openGraph: {
    title:       'Catálogo — Lanz Technology',
    description: 'Productos DJI, cámaras, audio, estabilizadores y accesorios premium en Venezuela.',
    url:         `${SITE_URL}/catalog`,
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Catálogo — Lanz Technology',
    description: 'Productos DJI, cámaras, micrófonos, estabilizadores y accesorios premium.',
  },
}

type Props = { searchParams: Promise<Record<string, string | undefined>> }

const PAGE_SIZE = 24

export default async function CatalogPage({ searchParams }: Props) {
  const sp = await searchParams

  const filters: StoreProductFilters = {
    categorySlug: sp.category ?? undefined,
    brand:        sp.brand    ?? undefined,
    sale:         sp.sale === 'true' ? true : undefined,
    featured:     sp.featured === 'true' ? true : undefined,
    sort:         (sp.sort as StoreSort) || 'featured',
    search:       sp.q        ?? undefined,
  }

  const page = Math.max(1, parseInt(sp.page ?? '1') || 1)

  const [{ products, total }, categories, brands] = await Promise.all([
    getPublishedProducts(filters, page, PAGE_SIZE),
    getPublicCategories(),
    getDistinctBrands(),
  ])

  const pages = Math.ceil(total / PAGE_SIZE)

  const hasActiveFilters = !!(sp.category || sp.brand || sp.sale || sp.featured || sp.q)

  // Determine heading
  let heading = 'Catálogo'
  let subheading = 'Explora productos DJI y tecnología premium seleccionada por Lanz Technology.'
  if (sp.sale === 'true') {
    heading    = 'Ofertas'
    subheading = 'Productos con precio especial por tiempo limitado.'
  } else if (sp.featured === 'true') {
    heading    = 'Destacados'
    subheading = 'Nuestra selección de productos más relevantes.'
  } else if (sp.q) {
    heading    = `Resultados: "${sp.q}"`
    subheading = `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}.`
  } else if (sp.category) {
    const cat = categories.find(c => c.slug === sp.category)
    if (cat) {
      heading    = cat.name
      subheading = cat.description ?? subheading
    }
  }

  return (
    <div className="animate-page">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="border-b border-lz-border bg-lz-surface/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs text-lz-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-lz-text transition-colors">Inicio</Link>
            <span aria-hidden>/</span>
            <span className="text-lz-text">Catálogo</span>
          </nav>
          <h1 className="text-2xl font-bold text-lz-text sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-lz-muted">{subheading}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div className="mb-6">
          <CatalogFilters
            categories={categories}
            brands={brands}
            currentCategory={sp.category}
            currentBrand={sp.brand}
            currentSort={(sp.sort as StoreSort) || 'featured'}
            currentSale={sp.sale === 'true'}
            currentSearch={sp.q}
            total={total}
            hasActiveFilters={hasActiveFilters}
            clearHref="/catalog"
          />
        </div>

        {/* ── Desktop: result count ─────────────────────────────────────── */}
        {products.length > 0 && (
          <p className="mb-5 hidden text-xs text-lz-muted lg:block">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de{' '}
            <span className="font-semibold text-lz-text">{total}</span> productos
          </p>
        )}

        {/* ── Category chips ────────────────────────────────────────────── */}
        {!sp.category && categories.length > 0 && !sp.q && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="shrink-0 rounded-full border border-lz-border bg-lz-surface px-3 py-1.5 text-xs font-medium text-lz-muted transition-all hover:border-lz-primary/50 hover:text-lz-text"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        {products.length === 0 ? (
          <StoreEmptyState
            icon={sp.q ? 'search' : 'box'}
            title={sp.q ? 'Sin resultados para esa búsqueda' : 'Sin productos en esta sección'}
            description={
              hasActiveFilters
                ? 'Prueba quitando algunos filtros.'
                : 'Vuelve pronto — el catálogo crece continuamente.'
            }
            cta={{ label: 'Ver catálogo completo', href: '/catalog' }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
            <CatalogPagination page={page} pages={pages} searchParams={sp} />
          </>
        )}
      </div>
    </div>
  )
}
