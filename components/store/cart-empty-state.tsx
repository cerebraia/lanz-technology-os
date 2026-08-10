import Link from 'next/link'

export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-lz-border bg-lz-surface">
        <svg
          width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-lz-muted" aria-hidden
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-lz-text">Tu carrito está vacío</h2>
        <p className="max-w-xs text-sm text-lz-muted">
          Explora nuestro catálogo y agrega los productos que deseas.
        </p>
      </div>

      <Link
        href="/catalog"
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-8 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
      >
        Explorar catálogo
      </Link>
    </div>
  )
}
