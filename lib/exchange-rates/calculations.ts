/**
 * Cálculos de precios con tasas de cambio
 *
 * Reglas de negocio:
 *   - Precio USD (efectivo/Zelle/USDT): cash_price_usd o sale_price como fallback
 *   - Precio BCV: bcv_reference_price_usd × tasa BCV vigente
 *   - Nunca recalcular el precio USD automáticamente desde bolívares
 *   - Usar numeric (number en JS) sin operaciones de punto flotante complejas
 */

export type ProductPricing = {
  cashPriceUSD:        number    // precio para efectivo/Zelle/USDT
  bcvReferenceUSD:     number    // precio base para calcular en bolívares
  bcvPriceVES:         number    // precio final en bolívares
  bcvRate:             number    // tasa BCV usada
  binanceRate:         number | null
  currency:            'USD' | 'VES'
}

export type PricingInput = {
  salePrice:           number
  cashPriceUSD:        number | null
  bcvReferencePriceUSD: number | null
  bcvRate:             number | null
  binanceRate:         number | null
}

export function calculatePricing(input: PricingInput): ProductPricing {
  const cashPrice = input.cashPriceUSD ?? input.salePrice
  const bcvRef    = input.bcvReferencePriceUSD ?? cashPrice
  const rate      = input.bcvRate ?? 1

  // Redondeo a 2 decimales para bolívares, sin acumulación de error flotante
  const bcvPriceVES = Math.round(bcvRef * rate * 100) / 100

  return {
    cashPriceUSD:    cashPrice,
    bcvReferenceUSD: bcvRef,
    bcvPriceVES,
    bcvRate:         rate,
    binanceRate:     input.binanceRate ?? null,
    currency:        'USD',
  }
}

export function formatVES(amount: number): string {
  return `Bs ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function formatUSD(amount: number): string {
  return `USD ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatRate(rate: number, source: 'bcv' | 'binance'): string {
  const label    = source === 'bcv' ? 'BCV' : 'Binance'
  const currency = source === 'bcv' ? 'USD' : 'USDT'
  return `${rate.toFixed(2)} Bs/${currency} (${label})`
}

export function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Caracas',
  })
}
