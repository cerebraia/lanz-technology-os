'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/features/catalog/data/categories'

type ProductFiltersProps = {
  categories: Category[]
}

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos los estados' },
  { value: 'draft',    label: 'Borrador' },
  { value: 'active',   label: 'Activo' },
  { value: 'archived', label: 'Archivado' },
]

const PUBLISHED_OPTIONS = [
  { value: '',      label: 'Visibilidad — todos' },
  { value: 'true',  label: 'Publicados' },
  { value: 'false', label: 'No publicados' },
]

const PROMO_OPTIONS = [
  { value: '',      label: 'Precio — todos' },
  { value: 'true',  label: 'En oferta' },
]

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router     = useRouter()
  const params     = useSearchParams()

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else       next.delete(key)
      next.delete('page') // reset pagination
      router.push(`?${next.toString()}`)
    },
    [params, router]
  )

  const hasFilters =
    params.get('search') ||
    params.get('status') ||
    params.get('published') ||
    params.get('promo') ||
    params.get('category')

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

      {/* Status */}
      <select
        value={params.get('status') ?? ''}
        onChange={(e) => push('status', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Published */}
      <select
        value={params.get('published') ?? ''}
        onChange={(e) => push('published', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {PUBLISHED_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Promo */}
      <select
        value={params.get('promo') ?? ''}
        onChange={(e) => push('promo', e.target.value)}
        className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
      >
        {PROMO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push('?')}
        >
          Limpiar
        </Button>
      )}
    </div>
  )
}
