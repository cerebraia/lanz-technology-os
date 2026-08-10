'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { executeAutomation }  from '@/features/automations/engine/execute'
import { getAutomationById }  from '@/features/automations/data/automations'
import type { Json }          from '@/lib/db/database.types'

export type AutomationActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createAutomationAction(
  _prev: AutomationActionState,
  formData: FormData
): Promise<AutomationActionState> {
  try { await req('automations.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const name        = (formData.get('name')         as string)?.trim()
  const description = (formData.get('description')  as string)?.trim() || null
  const triggerType = (formData.get('trigger_type') as string)
  const actionType  = (formData.get('action_type')  as string)
  const configRaw   = (formData.get('config')       as string) || '{}'

  const errors: Record<string, string[]> = {}
  if (!name)        errors.name         = ['El nombre es obligatorio.']
  if (!triggerType) errors.trigger_type = ['Selecciona un trigger.']
  if (!actionType)  errors.action_type  = ['Selecciona una acción.']

  let config: Record<string, unknown> = {}
  try { config = JSON.parse(configRaw) } catch { errors.config = ['JSON de configuración no válido.'] }

  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('automations')
    .insert({ name, description, trigger_type: triggerType, action_type: actionType, config: config as unknown as Json, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/automations')
  redirect(`/admin/automations/${data.id}`)
}

// ─── TOGGLE ENABLED ───────────────────────────────────────────────────────────

export async function toggleAutomationAction(id: string, enabled: boolean): Promise<{ error?: string }> {
  try { await req('automations.update') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('automations').update({ enabled }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/automations')
  revalidatePath(`/admin/automations/${id}`)
  return {}
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteAutomationAction(id: string): Promise<{ error?: string }> {
  try { await req('automations.delete') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('automations').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/automations')
  redirect('/admin/automations')
}

// ─── EXECUTE ──────────────────────────────────────────────────────────────────

export async function executeAutomationAction(
  automationId: string
): Promise<{ success: boolean; message: string }> {
  try { await req('automations.execute') } catch (e) { return { success: false, message: (e as Error).message } }

  const automation = await getAutomationById(automationId)
  if (!automation) return { success: false, message: 'Automatización no encontrada.' }
  if (!automation.enabled) return { success: false, message: 'La automatización está desactivada.' }

  const result = await executeAutomation(automation, 'manual')

  revalidatePath(`/admin/automations/${automationId}`)
  revalidatePath('/admin/automations/history')
  return { success: result.success, message: result.message }
}

// ─── BATCH TRIGGER ─────────────────────────────────────────────────────────────
// Called from app events (e.g. customer created, import received)

export async function fireTriggerAction(
  triggerType: string,
  context?: Record<string, unknown>
): Promise<void> {
  try { await req('automations.execute') } catch { return }

  const supabase = await createClient()
  const { data } = await supabase
    .from('automations')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('enabled', true)

  for (const auto of (data ?? [])) {
    // Fire-and-forget; errors are recorded in automation_runs
    executeAutomation(auto as never, `trigger:${triggerType}`, context).catch(() => {})
  }
}
