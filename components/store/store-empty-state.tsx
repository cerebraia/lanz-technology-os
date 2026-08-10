import Link from 'next/link'

type Props = {
  title?:       string
  description?: string
  icon?:        'search' | 'box' | 'cart'
  cta?:         { label: string; href: string }
}

const ICONS = {
  search: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
      <path d="M8 11h6M11 8v6" strokeWidth="1.5"/>
    </svg>
  ),
  box: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <path d="m3.27 6.96 8.73 5.04 8.73-5.04M12 22.08V12"/>
    </svg>
  ),
  cart: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
}

export function StoreEmptyState({
  title       = 'Sin resultados',
  description = 'Prueba con otros filtros o explora todo el catálogo.',
  icon        = 'search',
  cta         = { label: 'Ver catálogo completo', href: '/catalog' },
}: Props) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-lz-border bg-lz-surface text-lz-muted/50">
        {ICONS[icon]}
      </span>
      <div className="space-y-2">
        <p className="text-base font-semibold text-lz-text">{title}</p>
        <p className="max-w-sm text-sm text-lz-muted">{description}</p>
      </div>
      <Link
        href={cta.href}
        className="mt-1 inline-flex h-10 items-center rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
      >
        {cta.label}
      </Link>
    </div>
  )
}
