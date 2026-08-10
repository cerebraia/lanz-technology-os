import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Campaign = Database['public']['Tables']['marketing_campaigns']['Row']
export type CampaignWithSegment = Campaign & {
  customer_segments?: { name: string } | null
}

export async function getCampaigns(status?: string): Promise<CampaignWithSegment[]> {
  const supabase = await createClient()
  let query = supabase
    .from('marketing_campaigns')
    .select('*, customer_segments(name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener campañas: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []) as CampaignWithSegment[]
}

export async function getCampaignById(id: string): Promise<CampaignWithSegment | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('marketing_campaigns')
    .select('*, customer_segments(name)')
    .eq('id', id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any ?? null) as CampaignWithSegment | null
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const [campData, ccData] = await Promise.all([
    supabase.from('marketing_campaigns').select('status, budget'),
    supabase.from('campaign_customers').select('sent_at, converted_at'),
  ])

  const campaigns = campData.data ?? []
  const cc        = ccData.data ?? []

  const active    = campaigns.filter((c) => c.status === 'active').length
  const reached   = cc.filter((r) => r.sent_at).length
  const converted = cc.filter((r) => r.converted_at).length
  const totalBudget = campaigns
    .filter((c) => ['active','completed'].includes(c.status))
    .reduce((a, c) => a + (c.budget ?? 0), 0)

  return { active, reached, converted, totalBudget, totalCampaigns: campaigns.length }
}
