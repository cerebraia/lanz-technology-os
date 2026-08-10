'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS = [
  { value: '',      label: 'Todos' },
  { value: 'true',  label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
]

export function SupplierFilters({ countries }: { countries: string[] }) {
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

  const hasFilters = params.get('search') || params.get('country') || params.get('active')

  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        type="search"
        placeholder="Buscar por nombre, empresa o email…"
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => push('search', e.target.value)}
        className={[
          'h-9 w-full rounded-lg border bg-lz-surface px-3 text-sm',
          'text-lz-text placeholder:text-lz-muted/60 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
          'border-lz-border focus:border-lz-primary/60',
          'sm:w-64',
        ].join(' ')}
      />

      {countries.length > 0 && (
        <select
          value={params.get('country') ?? ''}
          onChange={(e) => push('country', e.target.value)}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
        >
          <option value="">Todos los países</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <select
        value={params.get('active') ?? ''}
        onChange={(e) => push('active', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
        <Button size="sm" variant="ghost" onClick={() => router.push('?')}>
          Limpiar
        </Button>
      )}
    </div>
  )
}
