'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, Suspense } from 'react'
import { PERIOD_OPTIONS } from '@/features/reports/data/period'

type Props = {
  showCustom?: boolean
  extraFilters?: React.ReactNode
}

// Inner component: uses useSearchParams so it must run inside <Suspense>
function PeriodFilterInner({ showCustom = true, extraFilters }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else       next.delete(key)
      router.push(`?${next.toString()}`)
    },
    [params, router]
  )

  const current  = params.get('period') ?? 'month'
  const isCustom = current === 'custom'

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1">
        {PERIOD_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => push('period', o.value)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              current === o.value
                ? 'bg-lz-primary text-white'
                : 'border border-lz-border text-lz-muted hover:text-lz-text',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
        {showCustom && (
          <button
            type="button"
            onClick={() => push('period', 'custom')}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isCustom ? 'bg-lz-primary text-white' : 'border border-lz-border text-lz-muted hover:text-lz-text',
            ].join(' ')}
          >
            Personalizado
          </button>
        )}
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={params.get('from') ?? ''}
            onChange={(e) => push('from', e.target.value)}
            className="h-8 rounded-lg border border-lz-border bg-lz-surface px-2 text-xs text-lz-text focus:outline-none focus:ring-1 focus:ring-lz-primary"
          />
          <span className="text-xs text-lz-muted">→</span>
          <input
            type="date"
            defaultValue={params.get('to') ?? ''}
            onChange={(e) => push('to', e.target.value)}
            className="h-8 rounded-lg border border-lz-border bg-lz-surface px-2 text-xs text-lz-text focus:outline-none focus:ring-1 focus:ring-lz-primary"
          />
        </div>
      )}

      {extraFilters}
    </div>
  )
}

// Public export: always safe to use without external Suspense
export function PeriodFilter(props: Props) {
  return (
    <Suspense fallback={null}>
      <PeriodFilterInner {...props} />
    </Suspense>
  )
}
