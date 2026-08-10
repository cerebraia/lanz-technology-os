'use server'

import { revalidatePath } from 'next/cache'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { saveRate } from '@/lib/exchange-rates/exchange-rate-service'
import { fetchBCVRate }     from '@/lib/exchange-rates/bcv-provider'
import { fetchBinanceRate } from '@/lib/exchange-rates/binance-provider'

export type RateActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requireAdmin() {
  await verifySession()
  const ok = await checkPermission('settings.manage')
  if (!ok) throw new Error('Sin permiso para gestionar tasas de cambio.')
}

// ─── Actualizar tasa manualmente ──────────────────────────────────────────────

export async function saveRateManualAction(
  _prev: RateActionState,
  formData: FormData
): Promise<RateActionState> {
  try { await requireAdmin() }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const source = formData.get('source') as 'bcv' | 'binance'
  const rateRaw = parseFloat(formData.get('rate') as string)

  if (!['bcv', 'binance'].includes(source)) return { errors: { source: ['Fuente inválida.'] } }
  if (!Number.isFinite(rateRaw) || rateRaw <= 0) return { errors: { rate: ['Ingresa una tasa válida mayor a cero.'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await saveRate({
    source,
    rate:      rateRaw,
    isManual:  true,
    notes:     'Actualización manual desde panel de administración.',
    createdBy: user?.id,
  })

  if (result.error) return { errors: { _: [result.error] } }

  revalidatePath('/admin/settings/exchange-rates')
  revalidatePath('/')
  revalidatePath('/catalog')
  return { success: true, message: `Tasa ${source.toUpperCase()} actualizada a ${rateRaw} Bs.` }
}

// ─── Actualizar tasa automáticamente ─────────────────────────────────────────

export async function refreshBCVRateAction(): Promise<{ error?: string; rate?: number }> {
  try { await requireAdmin() }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fetchResult = await fetchBCVRate()
  if (!fetchResult.success) {
    return { error: fetchResult.error }
  }

  const saveResult = await saveRate({
    source:    'bcv',
    rate:      fetchResult.rate,
    isManual:  false,
    notes:     `Actualización automática desde ${fetchResult.source}`,
    createdBy: user?.id,
  })

  if (saveResult.error) return { error: saveResult.error }

  revalidatePath('/admin/settings/exchange-rates')
  revalidatePath('/')
  return { rate: fetchResult.rate }
}

export async function refreshBinanceRateAction(): Promise<{ error?: string; rate?: number }> {
  try { await requireAdmin() }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fetchResult = await fetchBinanceRate()
  if (!fetchResult.success) {
    return { error: fetchResult.error }
  }

  const saveResult = await saveRate({
    source:    'binance',
    rate:      fetchResult.rate,
    isManual:  false,
    notes:     `Actualización automática desde ${fetchResult.source}`,
    createdBy: user?.id,
  })

  if (saveResult.error) return { error: saveResult.error }

  revalidatePath('/admin/settings/exchange-rates')
  return { rate: fetchResult.rate }
}
