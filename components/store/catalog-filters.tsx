'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { StoreSort } from '@/features/store/data/products'
import type { PublicCategory } from '@/features/store/data/categories'

type Props = {
  categories:      PublicCategory[]
  brands:          string[]
  currentCategory?: string
  currentBrand?:   string
  currentSort?:    StoreSort
  currentSale?:    boolean
  currentSearch?:  string
  total:           number
  formAction?:     string
  hasActiveFilters: boolean
  clearHref:       string
}

const SORT_OPTIONS: { value: StoreSort; label: string }[] = [
  { value: 'featured',   label: 'Recomendados' },
  { value: 'newest',     label: 'Más recientes' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_az',    label: 'Nombre: A–Z' },
]

function SelectField({
  name, label, value, options, all, form,
}: {
  name: string; label: string; value?: string
  options: { value: string; label: string }[]
  all?: string; form?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${form}-${name}`} className="text-[10px] font-semibold uppercase tracking-widest text-lz-muted">
        {label}
      </label>
      <select
        id={`${form}-${name}`}
        name={name}
        defaultValue={value ?? ''}
        form={form}
        className="h-9 w-full rounded-lg border border-lz-border bg-lz-surface px-3 text-xs text-lz-text focus:border-lz-primary focus:outline-none"
      >
        {all !== undefined && <option value="">{all}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function FilterForm({
  formId, categories, brands, currentCategory, currentBrand,
  currentSort, currentSale, currentSearch, formAction,
}: Omit<Props, 'total' | 'hasActiveFilters' | 'clearHref'> & { formId: string }) {
  return (
    <form
      id={formId}
      method="GET"
      action={formAction}
      className="contents"
    >
      {/* Hidden search param */}
      {currentSearch && (
        <input type="hidden" name="q" value={currentSearch} />
      )}

      <SelectField
        form={formId} name="category" label="Categoría"
        value={currentCategory}
        options={categories.map(c => ({ value: c.slug, label: c.name }))}
        all="Todas las categorías"
      />

      {brands.length > 0 && (
        <SelectField
          form={formId} name="brand" label="Marca"
          value={currentBrand}
          options={brands.map(b => ({ value: b, label: b }))}
          all="Todas las marcas"
        />
      )}

      <SelectField
        form={formId} name="sort" label="Ordenar por"
        value={currentSort ?? 'featured'}
        options={SORT_OPTIONS}
      />

      <label className="flex cursor-pointer items-center gap-2 self-end pb-0.5">
        <input
          type="checkbox"
          name="sale"
          value="true"
          form={formId}
          defaultChecked={currentSale === true}
          className="h-4 w-4 rounded border-lz-border bg-lz-surface accent-lz-primary"
        />
        <span className="text-xs font-medium text-lz-muted">Solo ofertas</span>
      </label>

      <button
        type="submit"
        form={formId}
        className="h-9 rounded-lg bg-lz-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-lz-primary-hover"
      >
        Aplicar
      </button>
    </form>
  )
}

export function CatalogFilters({
  categories, brands, currentCategory, currentBrand,
  currentSort, currentSale, currentSearch,
  total, hasActiveFilters, clearHref, formAction,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* ─── Desktop filter bar ────────────────────────────────────────── */}
      <div className="hidden items-end gap-4 lg:flex">
        <FilterForm
          formId="filter-desktop"
          {...{ categories, brands, currentCategory, currentBrand, currentSort, currentSale, currentSearch, formAction }}
        />
        {hasActiveFilters && (
          <Link href={clearHref} className="h-9 flex items-center text-xs text-lz-muted hover:text-lz-text transition-colors whitespace-nowrap">
            Limpiar filtros
          </Link>
        )}
      </div>

      {/* ─── Mobile top bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between lg:hidden">
        <p className="text-xs text-lz-muted">
          <span className="font-semibold text-lz-text">{total}</span> producto{total !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Link href={clearHref} className="text-xs text-lz-muted hover:text-lz-text transition-colors">
              Limpiar
            </Link>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg border border-lz-border bg-lz-surface px-3 text-xs font-medium text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6"  x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-lz-primary" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Mobile drawer ──────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={[
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        className={[
          'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-lz-sidebar border-t border-lz-border transition-transform duration-300 lg:hidden',
          drawerOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-lz-border px-5 py-4">
          <p className="text-sm font-semibold text-lz-text">Filtros</p>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-lz-muted hover:text-lz-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5">
          <FilterForm
            formId="filter-mobile"
            {...{ categories, brands, currentCategory, currentBrand, currentSort, currentSale, currentSearch, formAction }}
          />
          {hasActiveFilters && (
            <Link
              href={clearHref}
              onClick={() => setDrawerOpen(false)}
              className="h-9 flex items-center justify-center rounded-lg border border-lz-border text-xs text-lz-muted hover:text-lz-text transition-colors"
            >
              Limpiar todos los filtros
            </Link>
          )}
        </div>
        <div className="h-safe-bottom" />
      </div>
    </>
  )
}
