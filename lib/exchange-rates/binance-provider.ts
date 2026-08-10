/**
 * Binance P2P Provider — tasa de referencia USDT/VES
 *
 * Usa la API pública de Binance P2P para obtener el precio
 * de referencia de USDT en bolívares.
 * Se muestra únicamente como referencia informativa.
 */

export type FetchRateResult =
  | { success: true; rate: number; source: string }
  | { success: false; error: string }

const TIMEOUT_MS = 8_000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(id)
  }
}

export async function fetchBinanceRate(): Promise<FetchRateResult> {
  try {
    const body = JSON.stringify({
      asset:         'USDT',
      fiat:          'VES',
      merchantCheck: false,
      page:          1,
      payTypes:      [],
      publisherType: null,
      rows:          5,
      tradeType:     'BUY',
    })

    const res = await fetchWithTimeout('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status} desde Binance P2P` }
    }

    const json = await res.json() as { data?: { adv?: { price?: string } }[] }
    const prices = (json.data ?? [])
      .map(d => parseFloat(d.adv?.price ?? ''))
      .filter(p => Number.isFinite(p) && p > 0)

    if (prices.length === 0) {
      return { success: false, error: 'No se encontraron precios válidos en Binance P2P' }
    }

    // Promedio de las primeras ofertas como tasa referencial
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    return { success: true, rate: Math.round(avg * 100) / 100, source: 'binance-p2p' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
