import { createClient } from '@/lib/supabase/server'

export async function getMarketingReport() {
  const supabase = await createClient()

  const [campRes, ccRes, couponRes] = await Promise.all([
    supabase.from('marketing_campaigns').select('id, name, type, status, budget'),
    supabase.from('campaign_customers').select('campaign_id, sent_at, opened_at, clicked_at, converted_at'),
    supabase.from('discount_coupons').select('id, code, type, value, used_count, is_active'),
  ])

  const campaigns = campRes.data   ?? []
  const cc        = ccRes.data     ?? []
  const coupons   = couponRes.data ?? []

  const active      = campaigns.filter((c) => c.status === 'active').length
  const totalSent   = cc.filter((r) => r.sent_at).length
  const converted   = cc.filter((r) => r.converted_at).length
  const totalBudget = campaigns.filter((c) => ['active','completed'].includes(c.status))
    .reduce((a, c) => a + (c.budget ?? 0), 0)

  const conversionRate = totalSent > 0 ? (converted / totalSent) * 100 : 0

  const campaignRows = campaigns.map((c) => {
    const rows  = cc.filter((r) => r.campaign_id === c.id)
    const sent  = rows.filter((r) => r.sent_at).length
    const conv  = rows.filter((r) => r.converted_at).length
    return {
      id:     c.id,
      name:   c.name,
      type:   c.type,
      status: c.status,
      budget: c.budget,
      sent,
      converted: conv,
      convRate: sent > 0 ? (conv / sent) * 100 : 0,
    }
  })

  const activeCoupons = coupons.filter((c) => c.is_active)
  const totalUses     = coupons.reduce((a, c) => a + c.used_count, 0)

  return {
    activeCampaigns: active,
    totalSent,
    converted,
    conversionRate,
    totalBudget,
    campaignRows,
    activeCoupons: activeCoupons.length,
    totalCouponUses: totalUses,
    topCoupons: coupons.sort((a, b) => b.used_count - a.used_count).slice(0, 5),
  }
}
