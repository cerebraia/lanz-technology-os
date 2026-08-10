import { createClient } from '@/lib/supabase/server'

export type CampaignAnalytics = {
  campaignId:      string
  campaignName:    string
  type:            string
  status:          string
  budget:          number | null
  sent:            number
  opened:          number
  clicked:         number
  converted:       number
  openRate:        number
  clickRate:       number
  conversionRate:  number
  roi:             number | null
}

export async function getCampaignAnalytics(): Promise<CampaignAnalytics[]> {
  const supabase = await createClient()

  const [campaignsData, ccData] = await Promise.all([
    supabase.from('marketing_campaigns').select('id, name, type, status, budget').order('created_at', { ascending: false }),
    supabase.from('campaign_customers').select('campaign_id, sent_at, opened_at, clicked_at, converted_at'),
  ])

  const campaigns = campaignsData.data ?? []
  const cc        = ccData.data ?? []

  return campaigns.map((c) => {
    const rows       = cc.filter((r) => r.campaign_id === c.id)
    const sent       = rows.filter((r) => r.sent_at).length
    const opened     = rows.filter((r) => r.opened_at).length
    const clicked    = rows.filter((r) => r.clicked_at).length
    const converted  = rows.filter((r) => r.converted_at).length

    const openRate       = sent > 0 ? (opened    / sent) * 100 : 0
    const clickRate      = sent > 0 ? (clicked   / sent) * 100 : 0
    const conversionRate = sent > 0 ? (converted / sent) * 100 : 0

    // ROI requiere datos de ingresos generados — aquí lo estimamos por conversiones
    // En producción se vincularía con orders.total_amount
    const roi = c.budget && c.budget > 0 ? null : null

    return {
      campaignId:     c.id,
      campaignName:   c.name,
      type:           c.type,
      status:         c.status,
      budget:         c.budget,
      sent,
      opened,
      clicked,
      converted,
      openRate,
      clickRate,
      conversionRate,
      roi,
    }
  })
}

export async function getOverallAnalytics() {
  const analytics = await getCampaignAnalytics()
  const totalSent      = analytics.reduce((a, c) => a + c.sent, 0)
  const totalOpened    = analytics.reduce((a, c) => a + c.opened, 0)
  const totalClicked   = analytics.reduce((a, c) => a + c.clicked, 0)
  const totalConverted = analytics.reduce((a, c) => a + c.converted, 0)
  const totalBudget    = analytics.reduce((a, c) => a + (c.budget ?? 0), 0)

  return {
    totalSent,
    totalOpened,
    totalClicked,
    totalConverted,
    totalBudget,
    avgOpenRate:       totalSent > 0 ? (totalOpened    / totalSent) * 100 : 0,
    avgClickRate:      totalSent > 0 ? (totalClicked   / totalSent) * 100 : 0,
    avgConversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
    campaigns:         analytics,
  }
}
