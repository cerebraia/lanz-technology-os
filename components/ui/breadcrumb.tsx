import Link from 'next/link'

type BreadcrumbItem = { label: string; href?: string }

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center gap-1.5 text-xs text-lz-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href && i < items.length - 1 ? (
              <Link
                href={item.href}
                className="transition-colors hover:text-lz-text"
              >
                {item.label}
              </Link>
            ) : (
              <span className={i === items.length - 1 ? 'text-lz-text' : ''}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
