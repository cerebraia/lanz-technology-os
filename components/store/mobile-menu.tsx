'use client'

import { useEffect } from 'react'
import Link from 'next/link'

const NAV = [
  { label: 'Catálogo',  href: '/catalog' },
  { label: 'Ofertas',   href: '/catalog?sale=true' },
  { label: 'Nosotros',  href: '/about' },
  { label: 'Contacto',  href: '/contact' },
]

type Props = { open: boolean; onClose: () => void }

export function MobileMenu({ open, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-lz-sidebar transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-lz-border px-6 py-5">
          <span className="text-xs font-semibold tracking-[0.3em] text-lz-primary">LANZ TECHNOLOGY</span>
          <button onClick={onClose} className="text-lz-muted hover:text-lz-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-xl px-4 py-3 text-sm font-medium text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-lz-border p-4">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </aside>
    </>
  )
}
