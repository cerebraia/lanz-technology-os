'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { PERIOD_OPTIONS } from '@/features/finance/data/constants'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'income',     label: 'Ingresos' },
  { value: 'expense',    label: 'Egresos' },
  { value: 'adjustment', label: 'Ajustes' },
  { value: 'transfer',   label: 'Transferencias' },
]

export function TransactionFilters() {
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

  const hasFilters = params.get('search') || params.get('type') || params.get('period')

  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        type="search"
        placeholder="Buscar descripción…"
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => push('search', e.target.value)}
        className={[
          'h-9 w-full rounded-lg border bg-lz-surface px-3 text-sm',
          'text-lz-text placeholder:text-lz-muted/60',
          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50 border-lz-border',
          'sm:w-52',
        ].join(' ')}
      />

      <select
        value={params.get('type') ?? ''}
        onChange={(e) => push('type', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select
        value={params.get('period') ?? 'month'}
        onChange={(e) => push('period', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {hasFilters && (
        <Button size="sm" variant="ghost" onClick={() => router.push('?')}>Limpiar</Button>
      )}
    </div>
  )
}
