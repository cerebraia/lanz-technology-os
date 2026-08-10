import { getPublicRates } from '@/lib/exchange-rates/exchange-rate-service'
import { calculatePricing } from '@/lib/exchange-rates/calculations'
import type { StoreProduct } from '@/features/store/data/products'

type Props = {
  product: Pick<StoreProduct, 'sale_price' | 'promotional_price' | 'currency_code' | 'cash_price_usd' | 'bcv_reference_price_usd'>
  size?:   'sm' | 'md' | 'lg'
}

export async function DualPrice({ product, size = 'md' }: Props) {
  const rates = await getPublicRates()
  const pricing = calculatePricing({
    salePrice:            product.sale_price,
    cashPriceUSD:         product.cash_price_usd,
    bcvReferencePriceUSD: product.bcv_reference_price_usd,
    bcvRate:              rates.bcv,
    binanceRate:          rates.binance,
  })

  const priceClass = size === 'sm'
    ? 'text-sm font-bold'
    : size === 'lg'
    ? 'text-3xl font-bold tabular-nums'
    : 'text-base font-bold'

  const secondaryClass = size === 'sm'
    ? 'text-[11px]'
    : size === 'lg'
    ? 'text-base'
    : 'text-xs'

  if (size === 'sm') {
    return (
      <div className="space-y-0.5">
        <p className={`${priceClass} text-lz-text`}>
          USD {pricing.cashPriceUSD.toFixed(2)}
        </p>
        {rates.bcv && (
          <p className={`${secondaryClass} text-lz-muted tabular-nums`}>
            Bs {pricing.bcvPriceVES.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </p>
        )}
        <p className="text-[10px] text-lz-muted/70">Efectivo · USDT · Zelle</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* USD price */}
      <div>
        <p className={`${priceClass} text-lz-text`}>
          USD {pricing.cashPriceUSD.toFixed(2)}
        </p>
        <p className="text-[11px] text-lz-muted mt-0.5">Efectivo · USDT · Zelle</p>
      </div>

      {/* BCV price */}
      {rates.bcv && (
        <div className="rounded-lg border border-lz-border/50 bg-lz-surface/60 px-3 py-2">
          <p className={`${secondaryClass} font-bold text-lz-text tabular-nums`}>
            Bs {pricing.bcvPriceVES.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-lz-muted">
            Pago a tasa BCV · {pricing.bcvRate.toFixed(2)} Bs/USD
          </p>
        </div>
      )}
    </div>
  )
}
