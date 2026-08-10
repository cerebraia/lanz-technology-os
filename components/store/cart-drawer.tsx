'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link  from 'next/link'
import { useCart } from '@/lib/store/cart'

const MAX_PREVIEW = 4

type Props = { open: boolean; onClose: () => void }

export function CartDrawer({ open, onClose }: Props) {
  const { items, count, total, hydrated } = useCart()
  const panelRef = useRef<HTMLDivElement>(null)
  const currency = items[0]?.currency ?? 'USD'

  // Bloquea scroll del body mientras está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cierra con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Focus al abrir
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  const preview  = items.slice(0, MAX_PREVIEW)
  const overflow = items.length - MAX_PREVIEW

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={[
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito"
        tabIndex={-1}
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-lz-sidebar border-l border-lz-border',
          'transition-transform duration-300 ease-out outline-none',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lz-border px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-lz-text">Tu carrito</p>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lz-primary px-1.5 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="text-lz-muted transition-colors hover:text-lz-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hydrated ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lz-border bg-lz-surface text-lz-muted/40">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-lz-text">Tu carrito está vacío</p>
                <p className="mt-1 text-xs text-lz-muted">Agrega productos para comenzar</p>
              </div>
              <Link
                href="/catalog"
                onClick={onClose}
                className="rounded-xl bg-lz-primary px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-lz-primary-hover"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {preview.map(item => (
                <div key={item.id} className="flex gap-3 rounded-xl border border-lz-border bg-lz-surface p-3 transition-colors hover:border-lz-primary/30">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#0c0a18]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-0.5" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-lz-border" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="3"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="truncate text-xs font-semibold text-lz-text">{item.name}</p>
                    <p className="text-[10px] text-lz-muted">× {item.quantity}</p>
                    <p className="text-xs font-bold text-lz-accent tabular-nums">
                      {item.currency} {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              {overflow > 0 && (
                <p className="text-center text-xs text-lz-muted">
                  y {overflow} producto{overflow !== 1 ? 's' : ''} más
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-lz-border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-lz-muted">Total estimado</span>
              <span className="font-bold text-lz-text tabular-nums">
                {currency} {total.toFixed(2)}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-lz-primary text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
            >
              Ver carrito completo
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex h-9 w-full items-center justify-center rounded-xl border border-lz-border text-xs text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
            >
              Continuar
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
