'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { MobileMenu } from './mobile-menu'
import { CartDrawer }  from './cart-drawer'

const NAV = [
  { label: 'Catálogo', href: '/catalog' },
  { label: 'Ofertas',  href: '/catalog?sale=true' },
  { label: 'Nosotros', href: '/about' },
  { label: 'Contacto', href: '/contact' },
]

export function StoreNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen,   setCartOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const { count } = useCart()
  const pathname  = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={[
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'border-b border-lz-border/60 bg-lz-bg/95 backdrop-blur-xl shadow-[0_1px_0_rgba(42,36,56,0.7)]'
          : 'border-b border-transparent bg-lz-bg/40 backdrop-blur-md',
      ].join(' ')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none shrink-0">
            <span className="text-xs font-bold tracking-[0.35em] text-lz-primary">LANZ</span>
            <span className="text-[9px] tracking-[0.3em] text-lz-muted">TECHNOLOGY</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {NAV.map(item => {
              const active = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'relative px-3 py-2 text-sm transition-colors duration-200',
                    active
                      ? 'font-semibold text-lz-text'
                      : 'text-lz-muted hover:text-lz-text',
                  ].join(' ')}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-lz-primary"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <Link
              href="/search"
              aria-label="Buscar productos"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-surface hover:text-lz-text"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </Link>

            {/* Cart — abre drawer */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito${count > 0 ? `, ${count} producto${count !== 1 ? 's' : ''}` : ''}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-surface hover:text-lz-text"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {count > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-lz-primary text-[9px] font-bold text-white"
                  aria-hidden
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-surface hover:text-lz-text lg:hidden"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CartDrawer  open={cartOpen}   onClose={() => setCartOpen(false)} />
    </>
  )
}
