'use client'

import Image from 'next/image'
import Link  from 'next/link'
import { CartQuantityControl } from './cart-quantity-control'
import { useCart } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'

type Props = {
  item:         CartItem
  unavailable?: boolean
  priceChanged?: boolean
}

export function CartItemRow({ item, unavailable = false, priceChanged = false }: Props) {
  const { setQty, removeItem } = useCart()

  const lineTotal = (item.price * item.quantity).toFixed(2)

  return (
    <div
      className={[
        'flex gap-4 rounded-2xl border bg-lz-surface p-4 transition-colors',
        unavailable ? 'border-lz-danger/40 opacity-75' : 'border-lz-border',
      ].join(' ')}
    >
      {/* Image */}
      <Link
        href={`/product/${item.slug}`}
        tabIndex={unavailable ? -1 : undefined}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#0f0d1a] focus-visible:ring-2 focus-visible:ring-lz-primary"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="80px"
            className="object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl opacity-20" aria-hidden>📦</div>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-lz-bg/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-lz-danger">No disponible</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Link
          href={`/product/${item.slug}`}
          className="block truncate text-sm font-semibold text-lz-text hover:text-lz-accent transition-colors"
        >
          {item.name}
        </Link>
        <p className="text-xs text-lz-muted">SKU: {item.sku}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-lz-text tabular-nums">
            {item.currency} {item.price.toFixed(2)}
            <span className="ml-1 font-normal text-lz-muted">× {item.quantity}</span>
          </span>
          {priceChanged && (
            <span className="text-[10px] font-semibold text-lz-warning">
              ✦ Precio actualizado
            </span>
          )}
        </div>

        <p className="mt-auto text-xs font-semibold text-lz-accent tabular-nums">
          {item.currency} {lineTotal}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end justify-between gap-2">
        <CartQuantityControl
          quantity={item.quantity}
          max={item.maxAvailableQuantity}
          disabled={unavailable}
          size="sm"
          onIncrement={() => setQty(item.id, item.quantity + 1)}
          onDecrement={() => setQty(item.id, item.quantity - 1)}
        />

        <button
          type="button"
          onClick={() => removeItem(item.id)}
          aria-label={`Eliminar ${item.name} del carrito`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-danger focus-visible:underline"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
