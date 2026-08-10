'use client'

import Link from 'next/link'
import { useCart } from '@/lib/store/cart'

type Props = { hasUnavailable: boolean }

export function CartSummary({ hasUnavailable }: Props) {
  const { items, total, count, clear } = useCart()

  if (items.length === 0) return null

  // Calcular solo items disponibles para el total de checkout
  const currency = items[0]?.currency ?? 'USD'

  return (
    <div className="sticky top-24 rounded-2xl border border-lz-border bg-lz-surface p-6">
      <p className="text-sm font-semibold text-lz-text">Resumen del pedido</p>

      {/* Line items */}
      <div className="my-4 max-h-48 space-y-2 overflow-y-auto border-b border-lz-border pb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between gap-2 text-xs text-lz-muted">
            <span className="truncate">{item.name} × {item.quantity}</span>
            <span className="shrink-0 tabular-nums">
              {item.currency} {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-lz-muted">Total estimado</span>
        <span className="text-lg font-bold text-lz-text tabular-nums">
          {currency} {total.toFixed(2)}
        </span>
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-[10px] leading-relaxed text-lz-muted">
        El precio y la disponibilidad se validarán nuevamente antes de confirmar el pedido.
      </p>

      {/* Actions */}
      <div className="mt-5 space-y-2">
        {hasUnavailable ? (
          <div className="flex h-11 w-full items-center justify-center rounded-xl bg-lz-border text-sm font-semibold text-lz-muted cursor-not-allowed">
            Elimina los productos no disponibles
          </div>
        ) : (
          <Link
            href="/checkout"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-lz-primary text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
          >
            Continuar
          </Link>
        )}

        <Link
          href="/catalog"
          className="flex h-9 w-full items-center justify-center rounded-xl border border-lz-border text-xs text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
        >
          Seguir comprando
        </Link>

        {count > 0 && (
          <button
            type="button"
            onClick={clear}
            className="flex h-8 w-full items-center justify-center text-xs text-lz-muted transition-colors hover:text-lz-danger"
            aria-label="Vaciar carrito"
          >
            Vaciar carrito
          </button>
        )}
      </div>
    </div>
  )
}
