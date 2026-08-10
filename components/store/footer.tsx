import Link from 'next/link'
import { STORE_CONFIG } from '@/config/store'

const LINKS = {
  tienda: [
    { label: 'Catálogo',   href: '/catalog' },
    { label: 'Ofertas',    href: '/catalog?sale=true' },
    { label: 'Novedades',  href: '/catalog?sort=newest' },
  ],
  empresa: [
    { label: 'Nosotros',   href: '/about' },
    { label: 'Contacto',   href: '/contact' },
    { label: 'Garantías',  href: '/warranty' },
    { label: 'Envíos',     href: '/shipping' },
  ],
  soporte: [
    { label: 'Preguntas frecuentes',   href: '/faq' },
    { label: 'WhatsApp', href: `https://wa.me/${STORE_CONFIG.whatsappNumber}`, external: true },
    { label: 'Política de privacidad', href: '/privacy' },
  ],
}

const SOCIALS = [
  {
    label: 'Instagram',
    href:  STORE_CONFIG.instagramUrl,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href:  STORE_CONFIG.tiktokUrl,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.36 6.36 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href:  STORE_CONFIG.youtubeUrl,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
]

export function StoreFooter() {
  return (
    <footer className="border-t border-lz-border bg-lz-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex flex-col">
              <span className="text-xs font-semibold tracking-[0.3em] text-lz-primary">LANZ</span>
              <span className="text-[10px] tracking-[0.25em] text-lz-muted">TECHNOLOGY</span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-lz-muted">
              Tecnología premium en drones, cámaras y accesorios. Especialistas DJI. Envíos a todo el país.
            </p>
            {/* Social */}
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} — Lanz Technology (abre en nueva pestaña)`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-lz-border text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-text">Tienda</p>
            <ul className="space-y-3">
              {LINKS.tienda.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-lz-muted transition-colors hover:text-lz-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-text">Empresa</p>
            <ul className="space-y-3">
              {LINKS.empresa.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-lz-muted transition-colors hover:text-lz-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-text">Soporte</p>
            <ul className="space-y-3">
              {LINKS.soporte.map(l => (
                <li key={l.href}>
                  {'external' in l && l.external ? (
                    <a href={l.href} target="_blank" rel="noreferrer"
                      className="text-sm text-lz-muted transition-colors hover:text-lz-text">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-lz-muted transition-colors hover:text-lz-text">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-lz-border pt-8 sm:flex-row">
          <p className="text-xs text-lz-muted">
            © {new Date().getFullYear()} Lanz Technology. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-lz-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-lz-success" aria-hidden />
            Tienda en línea activa
          </div>
        </div>
      </div>
    </footer>
  )
}
