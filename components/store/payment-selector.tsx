'use client'

import { useState } from 'react'
import { calculatePricing, formatVES, formatUSD } from '@/lib/exchange-rates/calculations'

type Props = {
  cashPriceUSD:         number
  bcvReferencePriceUSD: number
  bcvRate:              number | null
  binanceRate:          number | null
  salePrice:            number
}

export function PaymentSelector({
  cashPriceUSD,
  bcvReferencePriceUSD,
  bcvRate,
  binanceRate,
  salePrice,
}: Props) {
  const [selected, setSelected] = useState<'usd' | 'ves'>('usd')

  const pricing = calculatePricing({
    salePrice,
    cashPriceUSD,
    bcvReferencePriceUSD,
    bcvRate,
    binanceRate,
  })

  const hasBCV = bcvRate !== null

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-lz-muted">
        Selecciona cómo deseas pagar
      </p>

      <div className="flex flex-col gap-2">
        {/* USD option */}
        <label className={[
          'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all',
          selected === 'usd'
            ? 'border-lz-primary bg-lz-primary/5 ring-1 ring-lz-primary/30'
            : 'border-lz-border bg-lz-surface hover:border-lz-primary/40',
        ].join(' ')}>
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="payment_currency"
              value="usd"
              checked={selected === 'usd'}
              onChange={() => setSelected('usd')}
              className="h-4 w-4 accent-lz-primary"
            />
            <div>
              <p className="text-sm font-semibold text-lz-text">
                {formatUSD(pricing.cashPriceUSD)}
              </p>
              <p className="text-[11px] text-lz-muted">Efectivo · USDT · Zelle</p>
            </div>
          </div>
          {selected === 'usd' && (
            <span className="rounded-full bg-lz-primary/15 px-2 py-0.5 text-[10px] font-bold text-lz-primary">
              Seleccionado
            </span>
          )}
        </label>

        {/* BCV option */}
        {hasBCV && (
          <label className={[
            'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all',
            selected === 'ves'
              ? 'border-lz-primary bg-lz-primary/5 ring-1 ring-lz-primary/30'
              : 'border-lz-border bg-lz-surface hover:border-lz-primary/40',
          ].join(' ')}>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment_currency"
                value="ves"
                checked={selected === 'ves'}
                onChange={() => setSelected('ves')}
                className="h-4 w-4 accent-lz-primary"
              />
              <div>
                <p className="text-sm font-semibold text-lz-text">
                  {formatVES(pricing.bcvPriceVES)}
                </p>
                <p className="text-[11px] text-lz-muted">
                  Calculado sobre {formatUSD(pricing.bcvReferenceUSD)} · Tasa BCV {pricing.bcvRate.toFixed(2)} Bs/USD
                </p>
              </div>
            </div>
            {selected === 'ves' && (
              <span className="rounded-full bg-lz-primary/15 px-2 py-0.5 text-[10px] font-bold text-lz-primary">
                Seleccionado
              </span>
            )}
          </label>
        )}
      </div>

      {/* Binance reference */}
      {binanceRate && (
        <p className="text-[11px] text-lz-muted/70">
          Referencia Binance: {binanceRate.toFixed(2)} Bs/USDT (solo informativo)
        </p>
      )}
    </div>
  )
}
