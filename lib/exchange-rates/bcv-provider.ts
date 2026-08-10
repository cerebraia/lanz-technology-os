/**
 * BCV Provider — tasa oficial del Banco Central de Venezuela
 *
 * El BCV no ofrece una API pública oficial.
 * Intentamos obtener la tasa desde ExchangeRate-API (fuente pública).
 * Si falla, el caller conserva la última tasa manual guardada.
 *
 * La tasa siempre se guarda con is_manual=false cuando viene de la fuente
 * automática, y is_manual=true cuando la actualiza un administrador.
 */

export type FetchRateResult =
  | { success: true; rate: number; source: string }
  | { success: false; error: string }

const TIMEOUT_MS = 8_000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(id)
  }
}

// Intenta obtener VES/USD desde ExchangeRate-API (tier gratuito)
// Si no está configurada la API key, retorna error para usar tasa manual.
export async function fetchBCVRate(): Promise<FetchRateResult> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY

  if (!apiKey) {
    return { success: false, error: 'EXCHANGE_RATE_API_KEY no configurada. Usa actualización manual.' }
  }

  try {
    const res = await fetchWithTimeout(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/VES`
    )

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status} desde ExchangeRate-API` }
    }

    const json = await res.json() as { result?: string; conversion_rate?: number }

    if (json.result !== 'success' || !json.conversion_rate) {
      return { success: false, error: 'Respuesta inválida de ExchangeRate-API' }
    }

    return { success: true, rate: json.conversion_rate, source: 'exchangerate-api' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
