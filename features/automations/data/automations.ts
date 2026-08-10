import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Automation    = Database['public']['Tables']['automations']['Row']
export type AutomationRun = Database['public']['Tables']['automation_runs']['Row']

export async function getAutomations(enabledOnly?: boolean): Promise<Automation[]> {
  const supabase = await createClient()
  let query = supabase.from('automations').select('*').order('created_at', { ascending: false })
  if (enabledOnly) query = query.eq('enabled', true)
  const { data, error } = await query
  if (error) throw new Error(`Error al obtener automatizaciones: ${error.message}`)
  return (data ?? []) as Automation[]
}

export async function getAutomationById(id: string): Promise<Automation | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('automations').select('*').eq('id', id).single()
  return (data ?? null) as Automation | null
}

export async function getAutomationsByTrigger(triggerType: string): Promise<Automation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('automations')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('enabled', true)
  return (data ?? []) as Automation[]
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const [autoRes, runRes] = await Promise.all([
    supabase.from('automations').select('enabled, run_count'),
    supabase.from('automation_runs').select('status, started_at').order('started_at', { ascending: false }).limit(100),
  ])

  const autos   = autoRes.data ?? []
  const runs    = runRes.data  ?? []

  const now7    = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const recentRuns = runs.filter((r) => r.started_at >= now7)

  return {
    total:      autos.length,
    active:     autos.filter((a) => a.enabled).length,
    totalRuns:  autos.reduce((a, r) => a + r.run_count, 0),
    completed:  recentRuns.filter((r) => r.status === 'completed').length,
    failed:     recentRuns.filter((r) => r.status === 'failed').length,
    pending:    recentRuns.filter((r) => r.status === 'pending').length,
  }
}
