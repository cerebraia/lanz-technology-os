'use server'

import { revalidatePath }    from 'next/cache'
import { createClient }      from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { generateSmartAlerts } from '@/features/ai/data/smart-alerts'

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

export async function dismissInsightAction(insightId: string): Promise<void> {
  try { await req('ai.insights') } catch { return }
  const supabase = await createClient()
  const { error } = await supabase.from('ai_insights').update({ resolved: true }).eq('id', insightId)
  if (!error) {
    revalidatePath('/admin/ai')
    revalidatePath('/admin/ai/insights')
    revalidatePath('/admin/notifications')
  }
}

export async function dismissRecommendationAction(recId: string): Promise<{ error?: string }> {
  try { await req('ai.recommendations') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('ai_recommendations').update({ is_dismissed: true }).eq('id', recId)
  if (error) return { error: error.message }
  revalidatePath('/admin/ai/recommendations')
  return {}
}

// Runs generateSmartAlerts() and persists results to ai_insights.
// Replaces previous auto-scan alerts (metadata.source = 'auto_scan') to avoid duplicates.
export async function persistAlertsAction(): Promise<void> {
  try { await req('ai.insights') } catch { return }

  const supabase = await createClient()

  // Remove previous auto-scan unresolved alerts to prevent duplicates
  await supabase
    .from('ai_insights')
    .delete()
    .eq('resolved', false)
    .filter('metadata->>source', 'eq', 'auto_scan')

  const alerts = await generateSmartAlerts()
  const toInsert = alerts.filter(a => !(a.type === 'general' && a.priority === 'low'))

  if (toInsert.length === 0) {
    revalidatePath('/admin/notifications')
    return
  }

  const { error } = await supabase.from('ai_insights').insert(
    toInsert.map(a => ({
      type:        a.type,
      title:       a.title,
      description: a.description,
      priority:    a.priority,
      metadata:    { ...a.metadata, source: 'auto_scan' },
      resolved:    false,
    }))
  )

  if (!error) {
    revalidatePath('/admin/notifications')
    revalidatePath('/admin/ai/insights')
    revalidatePath('/admin')
  }
}

export async function resolveAllAlertsAction(): Promise<void> {
  try { await req('ai.insights') } catch { return }
  const supabase = await createClient()
  const { error } = await supabase.from('ai_insights').update({ resolved: true }).eq('resolved', false)
  if (!error) {
    revalidatePath('/admin/notifications')
    revalidatePath('/admin/ai/insights')
  }
}
