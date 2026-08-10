import Image from 'next/image'
import Link  from 'next/link'
import { ProductAvailability } from './product-availability'
import type { StoreProduct } from '@/features/store/data/products'

type Props = {
  product:  StoreProduct
  priority?: boolean
}

const PAYMENT_METHODS = ['Efectivo USD', 'Zelle', 'USDT', 'Pago en bolívares']

export function ProductCard({ product, priority = false }: Props) {
  const displayPrice = product.cash_price_usd ?? product.sale_price

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-lz-border bg-lz-surface transition-all duration-300 hover:border-lz-primary/50 hover:shadow-[0_4px_28px_rgba(123,47,255,0.13)] focus-visible:outline-2 focus-visible:outline-lz-primary active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#0c0a18]">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 will-change-transform group-hover:scale-[1.06] sm:p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-lz-border" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <path d="m3 9 18 0M9 21V9"/>
            </svg>
          </div>
        )}

        {product.is_featured && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full border border-lz-accent/30 bg-lz-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-lz-accent">
              Destacado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.category && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-lz-primary">
            {product.category.name}
          </span>
        )}

        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-lz-text transition-colors duration-200 group-hover:text-lz-accent sm:text-sm">
          {product.name}
        </h3>

        {product.brand && (
          <span className="text-[10px] text-lz-muted sm:text-xs">{product.brand}</span>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-lz-border/50 pt-3">
          <p className="text-sm font-bold tabular-nums text-lz-text">
            USD {displayPrice.toFixed(2)}{' '}
            <span className="text-[10px] font-normal text-lz-muted">REF</span>
          </p>

          <ul className="space-y-0.5">
            {PAYMENT_METHODS.map((m) => (
              <li key={m} className="flex items-center gap-1 text-[10px] text-lz-muted">
                <span className="text-lz-success">✓</span>
                {m}
              </li>
            ))}
          </ul>

          <ProductAvailability inStock size="sm" />
        </div>
      </div>
    </Link>
  )
}
