import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { generateSmartAlerts } from '@/features/ai/data/smart-alerts'
import { getDailyInsights }    from '@/features/ai/data/insights'
import { AlertCard }    from '@/features/ai/components/alert-card'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }        from '@/components/ui/badge'
import { fmtCurrency }  from '@/features/reports/data/period'

export const metadata: Metadata = { title: 'Insights y alertas' }

export default async function InsightsPage() {
  await verifySession()
  const canRead = await checkPermission('ai.insights')
  if (!canRead) redirect('/admin/ai')

  const [alerts, insights] = await Promise.all([
    generateSmartAlerts(),
    getDailyInsights(),
  ])

  const byPriority = {
    critical: alerts.filter((a) => a.priority === 'critical'),
    high:     alerts.filter((a) => a.priority === 'high'),
    medium:   alerts.filter((a) => a.priority === 'medium'),
    low:      alerts.filter((a) => a.priority === 'low'),
  }

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Insights y alertas inteligentes"
        description="Análisis automático del estado del negocio. Actualizado en tiempo real."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'IA',        href: '/admin/ai' },
          { label: 'Insights' },
        ]}
        secondaryActions={
          <div className="flex gap-2">
            {byPriority.critical.length > 0 && <Badge variant="danger">{byPriority.critical.length} crítica{byPriority.critical.length > 1 ? 's' : ''}</Badge>}
            {byPriority.high.length > 0     && <Badge variant="warning">{byPriority.high.length} alta{byPriority.high.length > 1 ? 's' : ''}</Badge>}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerts by priority */}
        <div className="space-y-6 lg:col-span-2">
          {(['critical','high','medium','low'] as const).map((level) => {
            const group = byPriority[level]
            if (group.length === 0) return null
            return (
              <div key={level} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-lz-muted">
                  {level === 'critical' ? 'Críticas' : level === 'high' ? 'Altas' : level === 'medium' ? 'Medias' : 'Bajas'} ({group.length})
                </p>
                {group.map((a) => <AlertCard key={a.id} alert={a} />)}
              </div>
            )
          })}
        </div>

        {/* Insights summary */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Resumen financiero</p></CardHeader>
            <CardBody>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Ingresos del mes',   value: fmtCurrency(insights.financial.income),       color: 'text-lz-success' },
                  { label: 'Gastos del mes',     value: fmtCurrency(insights.financial.expense),      color: 'text-lz-danger'  },
                  { label: 'Utilidad neta',      value: fmtCurrency(insights.financial.net),          color: insights.financial.net >= 0 ? 'text-lz-success' : 'text-lz-danger' },
                  { label: 'Flujo de caja',      value: fmtCurrency(insights.financial.cashBalance),  color: 'text-lz-text'    },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-lz-muted">{label}</span>
                    <span className={['tabular-nums font-semibold', color].join(' ')}>{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Oportunidades</p></CardHeader>
            <CardBody>
              {insights.opportunities.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin oportunidades identificadas.</p>
              ) : (
                <ul className="space-y-2">
                  {insights.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 text-lz-success font-bold">↑</span>
                      <span className="text-lz-text">{o}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Riesgos detectados</p></CardHeader>
            <CardBody>
              {insights.risks.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin riesgos críticos detectados.</p>
              ) : (
                <ul className="space-y-2">
                  {insights.risks.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 text-lz-danger font-bold">⚠</span>
                      <span className="text-lz-text">{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
