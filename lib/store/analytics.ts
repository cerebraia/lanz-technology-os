/**
 * Analítica del cliente — Lanz Technology storefront
 *
 * Capa de abstracción de eventos del cliente.
 * Fase actual: console.info en desarrollo + gtag si está disponible.
 * Extensible a GA4, Posthog, Mixpanel u otro servicio.
 *
 * Reglas:
 * - No registrar mensajes de WhatsApp completos.
 * - Solo guardar: identificadores no sensibles, timestamps, origen.
 * - Nunca usar costos, márgenes, tokens ni datos personales.
 *
 * Uso: llamar desde Client Components o confirmation-actions.
 * Para tracking server-side usar features/analytics/actions/track-event.ts
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type Params = Record<string, string | number | boolean>

function fire(name: string, params: Params = {}): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, { ...params })
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[analytics]', name, params)
  }
}

// ─── Page events ──────────────────────────────────────────────────────────────

export function trackHomeView(): void {
  fire('page_view', { page: 'home', origin: 'storefront' })
}

export function trackCatalogView(filters?: string): void {
  fire('page_view', { page: 'catalog', filters: filters ?? '', origin: 'storefront' })
}

export function trackCategoryView(categorySlug: string): void {
  fire('page_view', { page: 'category', category: categorySlug, origin: 'storefront' })
}

export function trackProductView(productSlug: string, productName: string): void {
  fire('view_item', { item_id: productSlug, item_name: productName, origin: 'storefront' })
}

export function trackSearch(query: string, resultCount: number): void {
  fire('search', { search_term: query, result_count: resultCount, origin: 'storefront' })
}

// ─── Cart events ──────────────────────────────────────────────────────────────

export function trackAddToCart(productSlug: string, productName: string, price: number, currency: string): void {
  fire('add_to_cart', {
    item_id:  productSlug,
    item_name: productName,
    value:     price,
    currency,
    origin:    'storefront',
  })
}

export function trackRemoveFromCart(productSlug: string): void {
  fire('remove_from_cart', { item_id: productSlug, origin: 'storefront' })
}

// ─── Checkout events ──────────────────────────────────────────────────────────

export function trackCheckoutStarted(itemCount: number, total: number, currency: string): void {
  fire('begin_checkout', { item_count: itemCount, value: total, currency, origin: 'storefront' })
}

export function trackCheckoutCompleted(orderNumber: string): void {
  fire('purchase', {
    transaction_id: orderNumber,
    timestamp:      Date.now(),
    origin:         'storefront',
  })
}

export function trackWhatsAppClicked(orderNumber: string): void {
  fire('whatsapp_clicked', {
    order_id:  orderNumber,
    timestamp: Date.now(),
    origin:    'storefront',
  })
}
