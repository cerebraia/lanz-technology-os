import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']

export type CurrentRates = {
  bcv:     { rate: number; updatedAt: string; isManual: boolean } | null
  binance: { rate: number; updatedAt: string; isManual: boolean } | null
}

// ─── Leer tasa activa ─────────────────────────────────────────────────────────

export async function getCurrentRate(source: 'bcv' | 'binance'): Promise<ExchangeRate | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('source', source)
    .eq('status', 'active')
    .order('effective_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export async function getCurrentRates(): Promise<CurrentRates> {
  const [bcvRow, binanceRow] = await Promise.all([
    getCurrentRate('bcv'),
    getCurrentRate('binance'),
  ])

  return {
    bcv: bcvRow ? {
      rate:      Number(bcvRow.rate),
      updatedAt: bcvRow.effective_at,
      isManual:  bcvRow.is_manual,
    } : null,
    binance: binanceRow ? {
      rate:      Number(binanceRow.rate),
      updatedAt: binanceRow.effective_at,
      isManual:  binanceRow.is_manual,
    } : null,
  }
}

// ─── Para el frontend público (sin autenticación) ─────────────────────────────
// Usa el cliente con anon key — la política RLS permite SELECT status='active'

export async function getPublicRates(): Promise<{ bcv: number | null; binance: number | null; updatedAt: string | null }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('exchange_rates')
      .select('source, rate, effective_at')
      .eq('status', 'active')
      .order('effective_at', { ascending: false })

    const rows = data ?? []
    const bcvRow     = rows.find(r => r.source === 'bcv')
    const binanceRow = rows.find(r => r.source === 'binance')

    return {
      bcv:       bcvRow     ? Number(bcvRow.rate)     : null,
      binance:   binanceRow ? Number(binanceRow.rate)  : null,
      updatedAt: bcvRow?.effective_at ?? null,
    }
  } catch {
    return { bcv: null, binance: null, updatedAt: null }
  }
}

// ─── Guardar nueva tasa (reemplaza la activa) ─────────────────────────────────

export async function saveRate(params: {
  source:    'bcv' | 'binance'
  rate:      number
  isManual:  boolean
  notes?:    string
  createdBy?: string
}): Promise<{ error?: string }> {
  if (params.rate <= 0) return { error: 'La tasa debe ser mayor a cero.' }

  const supabase = await createClient()

  // Marcar la tasa anterior como 'stale'
  await supabase
    .from('exchange_rates')
    .update({ status: 'stale' })
    .eq('source', params.source)
    .eq('status', 'active')

  const now = new Date().toISOString()
  const baseCurrency = params.source === 'binance' ? 'USDT' : 'USD'

  const { error } = await supabase
    .from('exchange_rates')
    .insert({
      source:         params.source,
      base_currency:  baseCurrency,
      quote_currency: 'VES',
      rate:           params.rate,
      effective_at:   now,
      fetched_at:     now,
      status:         'active',
      is_manual:      params.isManual,
      notes:          params.notes ?? null,
      created_by:     params.createdBy ?? null,
    })

  if (error) return { error: error.message }
  return {}
}

// ─── Historial ────────────────────────────────────────────────────────────────

export async function getRateHistory(source: 'bcv' | 'binance', limit = 20): Promise<ExchangeRate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('source', source)
    .order('effective_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
