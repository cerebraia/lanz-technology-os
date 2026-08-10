'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import type { StoreProductDetail } from '@/features/store/data/products'
import { CartQuantityControl } from './cart-quantity-control'

type Props = {
  product: Pick<
    StoreProductDetail,
    'id' | 'name' | 'slug' | 'sku' | 'sale_price' | 'promotional_price' | 'currency_code' | 'primaryImageUrl' | 'inStock'
  >
}

export function AddToCartButton({ product }: Props) {
  const { addItem }   = useCart()
  const router        = useRouter()
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const effectivePrice = product.promotional_price && product.promotional_price < product.sale_price
    ? product.promotional_price
    : product.sale_price

  const outOfStock = !product.inStock

  function handleAdd() {
    if (outOfStock || adding) return
    setAdding(true)

    for (let i = 0; i < qty; i++) {
      addItem({
        id:       product.id,
        slug:     product.slug,
        name:     product.name,
        sku:      product.sku,
        price:    effectivePrice,
        currency: product.currency_code,
        image:    product.primaryImageUrl,
      })
    }

    setQty(1)
    router.push('/cart')
  }

  return (
    <div className="flex flex-col gap-4">
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-lz-muted">Cantidad:</span>
          <CartQuantityControl
            quantity={qty}
            onIncrement={() => setQty(q => q + 1)}
            onDecrement={() => setQty(q => Math.max(1, q - 1))}
            size="md"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock || adding}
        aria-disabled={outOfStock || adding}
        aria-label={outOfStock ? 'Producto agotado' : 'Agregar al carrito'}
        className={[
          'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold',
          'transition-all duration-200 active:scale-[0.98]',
          outOfStock
            ? 'cursor-not-allowed bg-lz-border text-lz-muted'
            : adding
            ? 'bg-lz-primary/70 text-white cursor-wait'
            : 'bg-lz-primary text-white hover:bg-lz-primary-hover',
        ].join(' ')}
      >
        {outOfStock ? 'Agotado' : adding ? 'Yendo al carrito…' : 'Agregar al carrito'}
      </button>
    </div>
  )
}
