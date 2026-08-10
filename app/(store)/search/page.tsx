import type { Metadata } from 'next'
import Link  from 'next/link'
import { ProductCard }          from '@/components/store/product-card'
import { searchPublishedProducts } from '@/features/store/data/products'

export const metadata: Metadata = {
  title: 'Búsqueda — Lanz Technology',
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const results = q.trim() ? await searchPublishedProducts(q.trim()) : []

  return (
    <div className="animate-page mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Search bar */}
      <form method="GET" className="mb-10">
        <div className="relative max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-lz-muted"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por nombre, SKU o marca…"
            autoFocus
            className="h-12 w-full rounded-xl border border-lz-border bg-lz-surface pl-11 pr-4 text-sm text-lz-text placeholder:text-lz-muted focus:border-lz-primary focus:outline-none focus:ring-2 focus:ring-lz-primary/30"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-lg bg-lz-primary px-4 text-xs font-semibold text-white hover:bg-lz-primary-hover transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      {q.trim() ? (
        <>
          <p className="mb-6 text-sm text-lz-muted">
            {results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`
              : `Sin resultados para "${q}"`}
          </p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="text-5xl">🔍</span>
              <p className="font-semibold text-lz-text">No encontramos productos</p>
              <p className="text-sm text-lz-muted">Intenta con otro término o explora el catálogo completo.</p>
              <Link href="/catalog" className="mt-2 rounded-xl bg-lz-primary px-6 py-2 text-sm font-semibold text-white hover:bg-lz-primary-hover">
                Ver catálogo
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl opacity-60">🔍</span>
          <p className="text-lz-muted">Ingresa un término para buscar.</p>
        </div>
      )}
    </div>
  )
}
