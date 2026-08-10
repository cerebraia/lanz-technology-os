'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'

type TypeOption = { value: string; label: string }

export function MovementFiltersBar({ typeOptions }: { typeOptions: TypeOption[] }) {
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

  const hasFilters =
    params.get('search') || params.get('type') ||
    params.get('from')   || params.get('to')

  return (
    <div className="flex flex-wrap items-end gap-2">
      {/* Search */}
      <input
        type="search"
        placeholder="Buscar por producto o SKU…"
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => push('search', e.target.value)}
        className={[
          'h-9 w-full rounded-lg border bg-lz-surface px-3 text-sm',
          'text-lz-text placeholder:text-lz-muted/60 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
          'border-lz-border focus:border-lz-primary/60',
          'sm:w-56',
        ].join(' ')}
      />

      {/* Movement type */}
      <select
        value={params.get('type') ?? ''}
        onChange={(e) => push('type', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        <option value="">Todos los tipos</option>
        {typeOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Date from */}
      <input
        type="date"
        value={params.get('from') ?? ''}
        onChange={(e) => push('from', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50 [color-scheme:dark]"
      />

      {/* Date to */}
      <input
        type="date"
        value={params.get('to') ?? ''}
        onChange={(e) => push('to', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50 [color-scheme:dark]"
      />

      {hasFilters && (
        <Button size="sm" variant="ghost" onClick={() => router.push('?')}>
          Limpiar
        </Button>
      )}
    </div>
  )
}
