import type { StoreProduct } from '@/features/store/data/products'

type Props = {
  product: Pick<StoreProduct, 'sale_price' | 'promotional_price' | 'currency_code'>
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
}

export function ProductPrice({ product, size = 'md', showBadge = true }: Props) {
  const { sale_price, promotional_price, currency_code } = product
  const hasPromo = !!promotional_price && promotional_price < sale_price
  const displayPrice = hasPromo ? promotional_price : sale_price

  const priceClass =
    size === 'sm' ? 'text-sm font-bold'
    : size === 'lg' ? 'text-3xl font-bold tabular-nums'
    : 'text-base font-bold'

  const origClass =
    size === 'sm' ? 'text-xs text-lz-muted line-through'
    : size === 'lg' ? 'text-lg text-lz-muted line-through tabular-nums'
    : 'text-sm text-lz-muted line-through'

  const discount = hasPromo
    ? Math.round((1 - promotional_price / sale_price) * 100)
    : 0

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={`${priceClass} text-lz-text`}>
        {currency_code} {displayPrice.toFixed(2)}
      </span>
      {hasPromo && (
        <>
          <span className={origClass}>{sale_price.toFixed(2)}</span>
          {showBadge && (
            <span className="rounded-full bg-lz-primary/15 px-2 py-0.5 text-[10px] font-bold text-lz-primary">
              −{discount}%
            </span>
          )}
        </>
      )}
    </div>
  )
}
