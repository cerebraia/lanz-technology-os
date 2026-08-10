import { getPublicRates } from '@/lib/exchange-rates/exchange-rate-service'
import { formatUpdatedAt } from '@/lib/exchange-rates/calculations'

export async function RatesBar() {
  const rates = await getPublicRates()

  if (!rates.bcv && !rates.binance) return null

  return (
    <div className="w-full bg-lz-sidebar/80 border-b border-lz-border/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 text-[11px] text-lz-muted">
          {rates.bcv && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-lz-text">BCV</span>
              <span className="tabular-nums">{rates.bcv.toFixed(2)} Bs/USD</span>
            </span>
          )}
          {rates.binance && (
            <span className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-lz-border/80">·</span>
              <span className="font-semibold text-lz-text">Binance</span>
              <span className="tabular-nums">{rates.binance.toFixed(2)} Bs/USDT</span>
              <span className="text-[10px] text-lz-muted/60">(ref.)</span>
            </span>
          )}
        </div>
        {rates.updatedAt && (
          <span className="hidden text-[10px] text-lz-muted/60 sm:block">
            Actualizado: {formatUpdatedAt(rates.updatedAt)}
          </span>
        )}
      </div>
    </div>
  )
}
