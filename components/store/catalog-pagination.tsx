import Link from 'next/link'

type Props = {
  page:         number
  pages:        number
  searchParams: Record<string, string | undefined>
}

function buildHref(searchParams: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v && k !== 'page') params.set(k, v)
  })
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `?${qs}` : '?'
}

export function CatalogPagination({ page, pages, searchParams }: Props) {
  if (pages <= 1) return null

  const prevHref = page > 1    ? buildHref(searchParams, page - 1) : null
  const nextHref = page < pages ? buildHref(searchParams, page + 1) : null

  // Show at most 5 page numbers around current
  const pageNums: number[] = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    pageNums.push(i)
  }

  return (
    <nav aria-label="Paginación" className="mt-12 flex items-center justify-center gap-1">
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex h-9 items-center rounded-lg border border-lz-border px-4 text-xs text-lz-muted transition-all hover:border-lz-primary/50 hover:text-lz-text"
          aria-label="Página anterior"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="flex h-9 items-center rounded-lg border border-lz-border/40 px-4 text-xs text-lz-muted/40 cursor-not-allowed">
          ← Anterior
        </span>
      )}

      <div className="hidden items-center gap-1 sm:flex">
        {pageNums[0] > 1 && (
          <>
            <Link href={buildHref(searchParams, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xs text-lz-muted hover:bg-lz-surface transition-colors">1</Link>
            {pageNums[0] > 2 && <span className="text-xs text-lz-muted px-1">…</span>}
          </>
        )}
        {pageNums.map(n => (
          <Link
            key={n}
            href={buildHref(searchParams, n)}
            className={[
              'flex h-9 w-9 items-center justify-center rounded-lg text-xs transition-colors',
              n === page
                ? 'bg-lz-primary font-semibold text-white'
                : 'text-lz-muted hover:bg-lz-surface hover:text-lz-text',
            ].join(' ')}
          >
            {n}
          </Link>
        ))}
        {pageNums[pageNums.length - 1] < pages && (
          <>
            {pageNums[pageNums.length - 1] < pages - 1 && <span className="text-xs text-lz-muted px-1">…</span>}
            <Link href={buildHref(searchParams, pages)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xs text-lz-muted hover:bg-lz-surface transition-colors">{pages}</Link>
          </>
        )}
      </div>

      <span className="flex h-9 items-center px-3 text-xs text-lz-muted sm:hidden">
        {page} / {pages}
      </span>

      {nextHref ? (
        <Link
          href={nextHref}
          className="flex h-9 items-center rounded-lg border border-lz-border px-4 text-xs text-lz-muted transition-all hover:border-lz-primary/50 hover:text-lz-text"
          aria-label="Página siguiente"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="flex h-9 items-center rounded-lg border border-lz-border/40 px-4 text-xs text-lz-muted/40 cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </nav>
  )
}
