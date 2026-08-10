'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type MarketingActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export async function createCampaignAction(
  _prev: MarketingActionState,
  formData: FormData
): Promise<MarketingActionState> {
  try { await req('marketing.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const name        = (formData.get('name')        as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const type        = (formData.get('type')        as string)
  const segmentId   = (formData.get('segment_id')  as string) || null
  const startDate   = (formData.get('start_date')  as string) || null
  const endDate     = (formData.get('end_date')    as string) || null
  const budget      = formData.get('budget') ? parseFloat(formData.get('budget') as string) : null
  const currency    = (formData.get('currency')    as string) || 'USD'

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es obligatorio.']
  if (!['email','whatsapp','discount','launch','remarketing'].includes(type))
    errors.type = ['Tipo de campaña no válido.']
  if (budget !== null && (!Number.isFinite(budget) || budget < 0))
    errors.budget = ['El presupuesto debe ser mayor o igual a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('marketing_campaigns')
    .insert({ name, description, type, segment_id: segmentId, start_date: startDate, end_date: endDate, budget, currency, created_by: user?.id })

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/marketing/campaigns')
  redirect(`/admin/marketing/campaigns`)
}

export async function updateCampaignStatusAction(
  campaignId: string,
  status: 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<{ error?: string }> {
  try { await req('marketing.update') } catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('marketing_campaigns')
    .update({ status })
    .eq('id', campaignId)

  if (error) return { error: error.message }

  revalidatePath('/admin/marketing/campaigns')
  return {}
}

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export async function createCouponAction(
  _prev: MarketingActionState,
  formData: FormData
): Promise<MarketingActionState> {
  try { await req('marketing.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const code           = (formData.get('code')           as string)?.trim().toUpperCase()
  const description    = (formData.get('description')    as string)?.trim() || null
  const type           = (formData.get('type')           as string)
  const value          = parseFloat(formData.get('value') as string)
  const minimumAmount  = parseFloat((formData.get('minimum_amount') as string) || '0')
  const usageLimit     = formData.get('usage_limit') ? parseInt(formData.get('usage_limit') as string) : null
  const expiresAt      = (formData.get('expires_at')     as string) || null

  const errors: Record<string, string[]> = {}
  if (!code)                                    errors.code  = ['El código es obligatorio.']
  if (!['percentage','fixed'].includes(type))   errors.type  = ['Tipo no válido.']
  if (!Number.isFinite(value) || value <= 0)    errors.value = ['El valor debe ser mayor a cero.']
  if (type === 'percentage' && value > 100)     errors.value = ['El porcentaje no puede superar 100.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('discount_coupons').insert({
    code, description, type, value,
    minimum_amount: minimumAmount,
    usage_limit:    usageLimit,
    expires_at:     expiresAt,
    created_by:     user?.id,
  })

  if (error) {
    if (error.code === '23505') return { errors: { code: ['Ya existe un cupón con ese código.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/marketing/coupons')
  return { success: true, message: `Cupón ${code} creado.` }
}

export async function toggleCouponAction(couponId: string, isActive: boolean): Promise<{ error?: string }> {
  try { await req('marketing.update') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('discount_coupons').update({ is_active: isActive }).eq('id', couponId)
  if (error) return { error: error.message }
  revalidatePath('/admin/marketing/coupons')
  return {}
}
