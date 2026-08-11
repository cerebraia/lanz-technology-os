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
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-[#0c0a18]">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-500 will-change-transform group-hover:scale-[1.06] sm:p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-lz-border sm:h-10 sm:w-10" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <path d="m3 9 18 0M9 21V9"/>
            </svg>
          </div>
        )}

        {product.is_featured && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full border border-lz-accent/30 bg-lz-accent/15 px-2 py-0.5 text-[9px] font-bold text-lz-accent sm:px-2.5 sm:text-[10px]">
              Destacado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4">
        {product.category && (
          <span className="text-[9px] font-semibold uppercase tracking-widest text-lz-primary sm:text-[10px]">
            {product.category.name}
          </span>
        )}

        <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug text-lz-text transition-colors duration-200 group-hover:text-lz-accent sm:text-sm">
          {product.name}
        </h3>

        {product.brand && (
          <span className="text-[9px] text-lz-muted sm:text-[10px]">{product.brand}</span>
        )}

        <div className="mt-auto flex flex-col gap-1.5 border-t border-lz-border/50 pt-2 sm:gap-2 sm:pt-3">
          <p className="text-xs font-bold tabular-nums text-lz-text sm:text-sm">
            USD {displayPrice.toFixed(2)}{' '}
            <span className="text-[9px] font-normal text-lz-muted sm:text-[10px]">REF</span>
          </p>

          {/* Métodos de pago: ocultos en mobile (espacio limitado en 2 columnas) */}
          <ul className="hidden space-y-0.5 sm:block">
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
