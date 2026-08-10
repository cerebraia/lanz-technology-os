import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getOverallAnalytics, type CampaignAnalytics } from '@/features/marketing/data/analytics'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '@/features/marketing/data/constants'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard }    from '@/components/ui/stat-card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { BarChart }    from '@/components/ui/bar-chart'
import { IconBar, IconUsers, IconDollar, IconMegaphone } from '@/components/icons'

export const metadata: Metadata = { title: 'Analíticas de marketing' }

function MetricBar({ label, value, color = 'bg-lz-primary' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-lz-text">{label}</span>
        <span className="tabular-nums text-lz-muted">{value.toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-lz-border">
        <div className={['h-full rounded-full transition-all', color].join(' ')} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  await verifySession()
  const canRead = await checkPermission('marketing.analytics.read')
  if (!canRead) redirect('/admin/marketing')

  const data = await getOverallAnalytics()

  const trendData = data.campaigns
    .filter((c) => c.sent > 0)
    .slice(0, 8)
    .map((c) => ({ label: c.campaignName.slice(0, 10), value: c.converted, color: 'success' as const }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Analíticas"
        description="Resultados y métricas de tus campañas de marketing."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'Analíticas' },
        ]}
      />

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Mensajes enviados"  value={String(data.totalSent)}      icon={<IconMegaphone size={18} />} />
        <StatCard label="Aperturas"          value={String(data.totalOpened)}    icon={<IconUsers     size={18} />} />
        <StatCard label="Clics"              value={String(data.totalClicked)}   icon={<IconBar       size={18} />} />
        <StatCard label="Conversiones"       value={String(data.totalConverted)} icon={<IconDollar    size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card>
          <p className="mb-4 text-sm font-semibold text-lz-text">Tasas promedio</p>
          <div className="space-y-4">
            <MetricBar label="Tasa de apertura"     value={data.avgOpenRate}       color="bg-lz-info"    />
            <MetricBar label="Tasa de clics"        value={data.avgClickRate}      color="bg-lz-primary" />
            <MetricBar label="Tasa de conversión"   value={data.avgConversionRate} color="bg-lz-success" />
          </div>
        </Card>

        {/* Conversions chart */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Conversiones por campaña</p>
          </CardHeader>
          <CardBody>
            {trendData.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin datos de campañas enviadas.</p>
            ) : (
              <BarChart data={trendData} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Per-campaign table */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Detalle por campaña</p>
        </CardHeader>
        {data.campaigns.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<IconMegaphone size={20} className="text-lz-muted" />}
              title="Sin campañas registradas"
              description="Crea y activa campañas para ver métricas aquí."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['Campaña', 'Tipo', 'Estado', 'Enviados', 'Apertura', 'Clics', 'Conversión', 'Presupuesto'].map((h) => (
                    <th key={h} className={['px-4 py-3 text-left font-medium', h !== 'Campaña' ? 'text-right' : ''].join(' ')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {data.campaigns.map((c: CampaignAnalytics) => {
                  const s = CAMPAIGN_STATUS_LABELS[c.status]
                  const t = CAMPAIGN_TYPE_LABELS[c.type]
                  return (
                    <tr key={c.campaignId} className="hover:bg-lz-surface/40">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-lz-text">{c.campaignName}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-medium" style={{ color: t?.color ?? '#888' }}>{t?.label ?? c.type}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{c.sent}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{c.openRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs">{c.clickRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-lz-success">{c.conversionRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-lz-muted">
                        {c.budget !== null ? `USD ${c.budget.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
