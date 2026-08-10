import type { Metadata } from 'next'
import { cache }     from 'react'
import { notFound }  from 'next/navigation'
import Link          from 'next/link'
import { Suspense }  from 'react'
import { ProductGallery }      from '@/components/store/product-gallery'
import { AddToCartButton }     from '@/components/store/add-to-cart'
import { ProductAvailability } from '@/components/store/product-availability'
import { RelatedProducts }     from '@/components/store/related-products'
import { ProductCardSkeleton } from '@/components/store/store-skeleton'
import { YouTubeEmbed }        from '@/components/store/youtube-embed'
import { getPublishedProductBySlug } from '@/features/store/data/products'

type Props = { params: Promise<{ slug: string }> }

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

// cache() deduplica la query entre generateMetadata y la función page()
const getProduct = cache(getPublishedProductBySlug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug }  = await params
  const product   = await getProduct(slug)

  if (!product) return { title: 'Producto no encontrado' }

  const description = product.short_description
    ?? `${product.name}${product.brand ? ` — ${product.brand}` : ''} disponible en Lanz Technology.`

  const images = product.primaryImageUrl
    ? [{ url: product.primaryImageUrl, alt: product.name, width: 1200, height: 630 }]
    : []

  return {
    title:       product.name,    // template añade "— Lanz Technology"
    description,
    alternates:  { canonical: `${SITE_URL}/product/${slug}` },
    openGraph: {
      title:       product.name,
      description,
      url:         `${SITE_URL}/product/${slug}`,
      type:        'website',
      images,
    },
    twitter: {
      card:        images.length ? 'summary_large_image' : 'summary',
      title:       product.name,
      description,
      images:      images.map(i => i.url),
    },
  }
}

const TRUST_ITEMS = [
  { icon: '🛡️', label: 'Garantía oficial' },
  { icon: '💬', label: 'Asesoría experta' },
  { icon: '🚚', label: 'Envío nacional' },
  { icon: '✓',  label: 'Compra segura' },
]

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product  = await getProduct(slug)

  if (!product) notFound()

  const displayPrice = product.cash_price_usd ?? product.sale_price

  const waMessage = encodeURIComponent(
    `Hola, me interesa el producto: *${product.name}* (SKU: ${product.sku}). ¿Está disponible?`
  )
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMessage}`

  // JSON-LD schemas — solo con datos reales, sin inventar specs ni reseñas
  const productSchema = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        product.name,
    description: product.short_description ?? product.description ?? undefined,
    image:       product.images.map(i => i.url),
    sku:         product.sku,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    offers: {
      '@type':       'Offer',
      price:          displayPrice.toFixed(2),
      priceCurrency:  product.currency_code,
      availability:   product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url:           `${SITE_URL}/product/${slug}`,
      seller:        { '@type': 'Organization', name: 'Lanz Technology' },
    },
  }

  const breadcrumbItems: { '@type': 'ListItem'; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Inicio',   item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalog` },
  ]
  if (product.category) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: product.category.name, item: `${SITE_URL}/category/${product.category.slug}` })
    breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: product.name,           item: `${SITE_URL}/product/${slug}` })
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: product.name,           item: `${SITE_URL}/product/${slug}` })
  }

  const breadcrumbSchema = {
    '@context':       'https://schema.org',
    '@type':          'BreadcrumbList',
    itemListElement:  breadcrumbItems,
  }

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema)    }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="animate-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-lz-muted" aria-label="Breadcrumb">
          <Link href="/" className="shrink-0 hover:text-lz-text transition-colors">Inicio</Link>
          <span aria-hidden>/</span>
          <Link href="/catalog" className="shrink-0 hover:text-lz-text transition-colors">Catálogo</Link>
          {product.category && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/category/${product.category.slug}`} className="shrink-0 hover:text-lz-text transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="truncate text-lz-text">{product.name}</span>
        </nav>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            {/* Category + SKU */}
            <div className="flex items-center justify-between gap-4">
              {product.category && (
                <Link
                  href={`/category/${product.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-widest text-lz-primary hover:text-lz-accent transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              <span className="shrink-0 text-xs text-lz-muted tabular-nums">SKU: {product.sku}</span>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold leading-tight text-lz-text sm:text-3xl">
              {product.name}
            </h1>

            {/* Brand + model */}
            <div className="flex flex-wrap gap-3">
              {product.brand && (
                <p className="text-sm text-lz-muted">
                  Marca: <span className="font-medium text-lz-text">{product.brand}</span>
                </p>
              )}
              {product.model && (
                <p className="text-sm text-lz-muted">
                  Modelo: <span className="font-medium text-lz-text">{product.model}</span>
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="text-3xl font-bold tabular-nums text-lz-text">
                USD {displayPrice.toFixed(2)}{' '}
                <span className="text-base font-normal text-lz-muted">REF</span>
              </p>
            </div>

            {/* Métodos de pago */}
            <div className="rounded-xl border border-lz-border bg-lz-surface/60 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-lz-muted">
                Métodos de pago
              </p>
              <ul className="space-y-1.5">
                {['Efectivo USD', 'Zelle', 'USDT', 'Pago en bolívares'].map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-lz-text">
                    <span className="text-lz-success font-bold">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability */}
            <ProductAvailability inStock={product.inStock} />

            {/* Short description */}
            {product.short_description && (
              <p className="border-b border-lz-border pb-5 text-sm leading-relaxed text-lz-muted">
                {product.short_description}
              </p>
            )}

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* WhatsApp secondary CTA */}
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-lz-border text-sm text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Consultar por WhatsApp
            </a>

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-lz-border bg-lz-surface/60 p-4 sm:grid-cols-4">
              {TRUST_ITEMS.map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-lg" aria-hidden>{item.icon}</span>
                  <span className="text-[10px] font-medium text-lz-muted leading-tight">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className="rounded-xl border border-lz-border bg-lz-surface p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-lz-muted">Entrega</p>
              <ul className="space-y-1.5 text-sm text-lz-text">
                <li className="flex items-center gap-2">
                  <span className="text-lz-success">✓</span>
                  <span>Delivery gratis en Caracas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lz-success">✓</span>
                  <span>Envíos nacionales por Zoom y MRW</span>
                </li>
              </ul>
              <p className="text-[11px] text-lz-muted">
                El costo del envío se coordina según destino por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* ── Full description ──────────────────────────────────────── */}
        {product.description && (
          <div className="mt-12 rounded-2xl border border-lz-border bg-lz-surface p-6 lg:p-8">
            <h2 className="mb-4 text-base font-semibold text-lz-text">Descripción del producto</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-lz-muted">
              {product.description}
            </p>
          </div>
        )}

        {/* ── Video de producto ────────────────────────────────────── */}
        {product.youtube_url && (
          <div className="mt-12 rounded-2xl border border-lz-border bg-lz-surface p-6 lg:p-8">
            <h2 className="mb-4 text-base font-semibold text-lz-text">
              Conoce más sobre este producto
            </h2>
            <YouTubeEmbed url={product.youtube_url} title={`Video de ${product.name}`} />
          </div>
        )}

        {/* ── Related products ──────────────────────────────────────── */}
        <Suspense
          fallback={
            <div className="mt-16 border-t border-lz-border pt-12">
              <div className="mb-6 h-6 w-48 animate-pulse rounded bg-lz-surface" />
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
              </div>
            </div>
          }
        >
          <RelatedProducts
            productId={product.id}
            categoryId={product.category?.id ?? null}
          />
        </Suspense>
      </div>
    </>
  )
}
