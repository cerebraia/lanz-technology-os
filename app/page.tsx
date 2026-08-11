import type { Metadata } from 'next'
import Link from 'next/link'
import { StoreNavbar }           from '@/components/store/navbar'
import { StoreFooter }           from '@/components/store/footer'
import { ProductCard }           from '@/components/store/product-card'
import { YouTubeEmbed }          from '@/components/store/youtube-embed'
import { WhatsAppFloatingButton } from '@/components/store/whatsapp-floating-button'
import { getFeaturedProducts }   from '@/features/store/data/products'
import { getPublicCategories }   from '@/features/store/data/categories'
import { STORE_CONFIG }          from '@/config/store'

const YT_CHANNEL_URL    = 'https://www.youtube.com/@lanz_technology'
const YT_FEATURED_VIDEO = 'https://www.youtube.com/watch?v=MDRHuMUHH9Q&t=31s'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

// Regenerar el Home cada 60 segundos (ISR) para reflejar cambios de catálogo sin redeploy.
// Las Server Actions de catálogo llaman revalidatePath('/') para invalidación inmediata.
export const revalidate = 60

export const metadata: Metadata = {
  title:       'Lanz Technology — Drones, Cámaras y Tecnología Premium',
  description: 'Tienda oficial de Lanz Technology. Drones DJI, cámaras, estabilizadores y accesorios premium. Envíos a todo el país.',
  alternates:  { canonical: SITE_URL },
  openGraph: {
    title:       'Lanz Technology — Drones, Cámaras y Tecnología Premium',
    description: 'Tienda oficial de Lanz Technology. Drones DJI, cámaras y accesorios premium. Envíos a todo el país.',
    url:         SITE_URL,
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Lanz Technology — Drones, Cámaras y Tecnología Premium',
    description: 'Tienda oficial. Drones DJI, cámaras y accesorios premium. Envíos a todo el país.',
  },
}

const CATEGORY_ICONS: Record<string, string> = {
  drones:          '🚁',
  camaras:         '📷',
  'camaras-accion': '🎥',
  accesorios:      '🔋',
  estabilizadores: '🎬',
}

const FEATURED_CATEGORIES = [
  { label: 'Drones',          slug: 'drones',          desc: 'Vuela sin límites', icon: '🚁' },
  { label: 'Cámaras',         slug: 'camaras',         desc: 'Captura cada momento', icon: '📷' },
  { label: 'Accesorios',      slug: 'accesorios',      desc: 'Complementa tu equipo', icon: '🔋' },
  { label: 'Estabilizadores', slug: 'estabilizadores', desc: 'Movimientos perfectos', icon: '🎬' },
]

const BENEFITS = [
  { icon: '🛡️', title: 'Garantía oficial', desc: 'Productos con garantía de fábrica y soporte técnico.' },
  { icon: '💬', title: 'Atención personalizada', desc: 'Asesoría experta por WhatsApp antes y después de tu compra.' },
  { icon: '🚚', title: 'Envíos a todo el país', desc: 'Recibe tu pedido donde estés. Coordinamos juntos.' },
  { icon: '⭐', title: 'Tecnología premium', desc: 'Solo marcas líderes: DJI, GoPro, Insta360 y más.' },
]

const CUSTOM_ORDER_WA_URL = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
  'Hola, equipo de Lanz Technology. Estoy buscando un producto que no aparece actualmente en el catálogo y quisiera consultar si pueden conseguirlo bajo pedido.'
)}`

// JSON-LD schemas — solo con datos reales, sin inventar información
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type':    'Organization',
  name:        'Lanz Technology',
  url:         SITE_URL,
  description: 'Tienda oficial de tecnología premium: drones DJI, cámaras y accesorios.',
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:       'Lanz Technology',
  url:         SITE_URL,
  potentialAction: {
    '@type':  'SearchAction',
    target:   { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8).catch(() => []),
    getPublicCategories().catch(() => []),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />

      <StoreNavbar />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
          {/* Glows */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-lz-primary/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-lz-accent/5 blur-[100px]" />
          </div>

          <div className="relative max-w-3xl">
            <div className="animate-slide-up delay-75 mb-6 inline-flex items-center gap-2 rounded-full border border-lz-primary/30 bg-lz-primary/10 px-4 py-1.5 text-xs font-semibold text-lz-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-lz-primary" aria-hidden />
              Tecnología premium · Envíos nacionales
            </div>

            <h1 className="animate-slide-up delay-150 mb-6 text-4xl font-bold leading-tight tracking-tight text-lz-text sm:text-5xl lg:text-6xl">
              Vuela más alto con{' '}
              <span className="bg-gradient-to-r from-lz-primary to-lz-accent bg-clip-text text-transparent">
                tecnología de punta
              </span>
            </h1>

            <p className="animate-slide-up delay-225 mb-10 text-base leading-relaxed text-lz-muted sm:text-lg">
              Drones, cámaras, estabilizadores y accesorios premium. Todo lo que necesitas para capturar el mundo desde otra perspectiva.
            </p>

            <div className="animate-slide-up delay-300 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/catalog"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-lz-primary px-8 text-sm font-semibold text-white transition-all duration-200 hover:bg-lz-primary-hover hover:shadow-[0_0_28px_rgba(123,47,255,0.45)] active:scale-[0.97]"
              >
                Explorar catálogo
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}`}
                target="_blank" rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-lz-border/70 px-8 text-sm font-semibold text-lz-muted transition-all duration-200 hover:border-lz-primary/50 hover:text-lz-text hover:bg-lz-surface/60 active:scale-[0.97]"
              >
                Consultar por WhatsApp
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <div className="h-10 w-px bg-gradient-to-b from-lz-border to-transparent" />
            <span className="text-[10px] tracking-widest text-lz-muted">SCROLL</span>
          </div>
        </section>

        {/* ── Categorías destacadas ─────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Explora por categoría</p>
            <h2 className="text-2xl font-bold text-lz-text sm:text-3xl">Encuentra lo que buscas</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(categories.length > 0 ? categories.slice(0, 4) : FEATURED_CATEGORIES).map((cat, i) => {
              const icon = (cat as { icon?: string }).icon
                ?? CATEGORY_ICONS[(cat as { slug: string }).slug]
                ?? '📦'
              const slug = (cat as { slug: string }).slug
              const label = (cat as { name?: string; label?: string }).name ?? (cat as { label: string }).label
              const desc  = (cat as { description?: string | null; desc?: string }).description
                ?? (cat as { desc?: string }).desc
                ?? ''

              return (
                <Link
                  key={slug ?? i}
                  href={`/catalog?category=${slug}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-lz-border bg-lz-surface p-6 transition-all duration-200 hover:border-lz-primary/50 hover:bg-lz-surface hover:shadow-[0_4px_24px_rgba(123,47,255,0.12)] active:scale-[0.98]"
                >
                  <span className="text-3xl transition-transform duration-200 group-hover:scale-110">{icon}</span>
                  <div>
                    <p className="font-semibold text-lz-text transition-colors duration-200 group-hover:text-lz-accent">{label}</p>
                    {desc && <p className="mt-1 text-xs text-lz-muted">{desc}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Productos destacados ──────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="border-t border-lz-border bg-lz-surface/40">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Selección premium</p>
                  <h2 className="text-2xl font-bold text-lz-text sm:text-3xl">Productos destacados</h2>
                </div>
                <Link href="/catalog" className="hidden text-sm font-medium text-lz-muted hover:text-lz-text transition-colors sm:block">
                  Ver todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-10 text-center sm:hidden">
                <Link href="/catalog" className="text-sm font-medium text-lz-muted hover:text-lz-text transition-colors">
                  Ver todos los productos →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Productos bajo pedido ────────────────────────────────────── */}
        <section className="border-t border-lz-border" aria-labelledby="custom-order-heading">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-lz-primary/20 bg-lz-surface px-8 py-10 sm:px-12 sm:py-12 lg:flex lg:items-center lg:gap-16">
              {/* Glow decorativo */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-lz-primary/8 blur-[90px]"
              />

              {/* Icono y texto */}
              <div className="relative flex-1">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-lz-primary/30 bg-lz-primary/10">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-lz-primary"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                  </svg>
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">
                  Servicio especial
                </p>
                <h2
                  id="custom-order-heading"
                  className="mb-4 text-2xl font-bold leading-tight text-lz-text sm:text-3xl"
                >
                  ¿No encuentras el producto que buscas?
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-lz-text sm:text-base">
                  En Lanz Technology también trabajamos productos tecnológicos bajo pedido.
                </p>
                <p className="mb-3 text-sm leading-relaxed text-lz-muted">
                  Si estás buscando cámaras, micrófonos, accesorios DJI, soluciones de energía, estabilizadores u otros equipos tecnológicos que no aparecen actualmente en nuestro catálogo, podemos ayudarte a conseguirlos.
                </p>
                <p className="text-sm leading-relaxed text-lz-muted">
                  Contáctanos por WhatsApp, indícanos el producto que necesitas y te confirmaremos disponibilidad, precio estimado y tiempo de entrega.
                </p>
              </div>

              {/* CTA */}
              <div className="relative mt-8 flex-shrink-0 lg:mt-0">
                <a
                  href={CUSTOM_ORDER_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Consultar producto bajo pedido por WhatsApp"
                  className="inline-flex h-14 items-center gap-3 rounded-xl bg-[#25D366] px-8 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,211,102,0.25)] transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                  Solicitar producto por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Beneficios ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">¿Por qué elegirnos?</p>
            <h2 className="text-2xl font-bold text-lz-text sm:text-3xl">Tu experiencia, nuestra prioridad</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(b => (
              <div
                key={b.title}
                className="group flex flex-col gap-4 rounded-2xl border border-lz-border bg-lz-surface p-6 transition-all duration-200 hover:border-lz-primary/30 hover:shadow-[0_2px_16px_rgba(123,47,255,0.08)]"
              >
                <span className="text-3xl transition-transform duration-200 group-hover:scale-110">{b.icon}</span>
                <div>
                  <p className="font-semibold text-lz-text">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-lz-muted">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Formas de pago y envíos ──────────────────────────────────── */}
        <section className="border-t border-lz-border bg-lz-surface/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Pagos */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Pagos</p>
                <h2 className="mb-6 text-xl font-bold text-lz-text sm:text-2xl">Formas de pago</h2>
                <ul className="space-y-3">
                  {[
                    { icon: '💵', label: 'Efectivo USD' },
                    { icon: '💳', label: 'Zelle' },
                    { icon: '🪙', label: 'USDT' },
                    { icon: '🇻🇪', label: 'Pago en bolívares' },
                  ].map(({ icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-lz-text">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-lz-border bg-lz-surface text-base">{icon}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Envíos */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Logística</p>
                <h2 className="mb-6 text-xl font-bold text-lz-text sm:text-2xl">Envíos</h2>
                <ul className="space-y-3">
                  {[
                    { icon: '🛵', label: 'Delivery gratis en Caracas' },
                    { icon: '📦', label: 'Envíos nacionales por Zoom' },
                    { icon: '🚚', label: 'Envíos nacionales por MRW' },
                    { icon: '💬', label: 'Atención personalizada por WhatsApp' },
                  ].map(({ icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-lz-text">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-lz-border bg-lz-surface text-base">{icon}</span>
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-lz-muted">
                  El costo del envío nacional se coordina según el destino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Canal de YouTube ─────────────────────────────────────────── */}
        <section className="border-t border-lz-border">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Canal oficial</p>
              <h2 className="text-2xl font-bold text-lz-text sm:text-3xl">
                Contenido de Lanz Technology
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-lz-muted">
                Reviews, tutoriales y demos en video de los mejores productos de tecnología.
              </p>
            </div>

            <YouTubeEmbed
              url={YT_FEATURED_VIDEO}
              title="DJI Mic Mini — Lanz Technology"
              className="mb-8"
            />

            <div className="text-center">
              <a
                href={YT_CHANNEL_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-lz-border bg-lz-surface px-6 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
              >
                {/* YouTube icon */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#FF0000]" aria-hidden>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Ver canal en YouTube
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA Final ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-lz-border">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lz-primary/8 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <h2 className="mb-4 text-2xl font-bold text-lz-text sm:text-3xl">¿Listo para volar?</h2>
            <p className="mb-8 text-lz-muted">Contáctanos directamente por WhatsApp y te ayudamos a elegir el equipo perfecto.</p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}`}
              target="_blank" rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#25D366] px-8 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Hablar por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <StoreFooter />
      <WhatsAppFloatingButton />
    </div>
  )
}
