import { createClient } from '@/lib/supabase/server'
import type { AutomationRun } from './automations'

export type RunWithAutomation = AutomationRun & {
  automations?: { name: string; action_type: string; trigger_type: string } | null
}

export async function getRunHistory(limit = 100): Promise<RunWithAutomation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automation_runs')
    .select('*, automations(name, action_type, trigger_type)')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Error al obtener historial: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []) as RunWithAutomation[]
}

export async function getRunsByAutomation(automationId: string, limit = 50): Promise<AutomationRun[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('automation_runs')
    .select('*')
    .eq('automation_id', automationId)
    .order('started_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as AutomationRun[]
}
