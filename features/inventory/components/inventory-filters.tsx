'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/features/catalog/data/categories'

const STOCK_OPTIONS = [
  { value: '',    label: 'Todos los estados' },
  { value: 'out', label: 'Sin stock' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'ok',  label: 'En stock' },
]

export function InventoryFilters({ categories }: { categories: Category[] }) {
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
    params.get('search') || params.get('category') || params.get('stock')

  return (
    <div className="flex flex-wrap items-end gap-2">
      {/* Search */}
      <input
        type="search"
        placeholder="Buscar por nombre o SKU…"
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

      {/* Category */}
      <select
        value={params.get('category') ?? ''}
        onChange={(e) => push('category', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Stock status */}
      <select
        value={params.get('stock') ?? ''}
        onChange={(e) => push('stock', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {STOCK_OPTIONS.map((o) => (
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
