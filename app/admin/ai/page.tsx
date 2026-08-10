import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { generateSmartAlerts } from '@/features/ai/data/smart-alerts'
import { getDailyInsights }    from '@/features/ai/data/insights'
import { AlertCard }   from '@/features/ai/components/alert-card'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard }    from '@/components/ui/stat-card'
import { Badge }       from '@/components/ui/badge'
import { fmtCurrency } from '@/features/reports/data/period'
import { IconBar, IconUsers, IconBox, IconDollar } from '@/components/icons'

export const metadata: Metadata = { title: 'Inteligencia Artificial' }

const AI_MODULES = [
  { label: 'Predicciones',     href: '/admin/ai/predictions',     desc: 'Agotamiento de inventario',   icon: '🔮' },
  { label: 'Recomendaciones',  href: '/admin/ai/recommendations', desc: 'Qué comprar y cuándo',        icon: '💡' },
  { label: 'Alertas',          href: '/admin/ai/insights',        desc: 'Alertas inteligentes activas', icon: '🚨' },
  { label: 'Asistente',        href: '/admin/ai/assistant',       desc: 'Consultas empresariales',      icon: '🤖' },
]

async function AIDashboard() {
  const [alerts, insights] = await Promise.all([
    generateSmartAlerts(),
    getDailyInsights(),
  ])

  const critical = alerts.filter((a) => a.priority === 'critical').length
  const high     = alerts.filter((a) => a.priority === 'high').length

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Alertas críticas"  value={String(critical)}  icon={<IconBar  size={18} />} />
        <StatCard label="Alertas altas"     value={String(high)}      icon={<IconBar  size={18} />} />
        <StatCard label="Ventas del mes"    value={fmtCurrency(insights.sales.revenue)}  icon={<IconDollar size={18} />} />
        <StatCard label="Flujo de caja"     value={fmtCurrency(insights.financial.cashBalance)} icon={<IconDollar size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-lz-text">Alertas activas</h2>
            <Link href="/admin/ai/insights" className="text-xs text-lz-accent hover:underline">Ver todas</Link>
          </div>
          {alerts.slice(0, 6).map((a) => <AlertCard key={a.id} alert={a} />)}
        </div>

        {/* Daily insights sidebar */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Resumen del día</p></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Ingresos mes',  value: fmtCurrency(insights.financial.income),     icon: <IconDollar size={14} />, color: 'text-lz-success' },
                  { label: 'Gastos mes',    value: fmtCurrency(insights.financial.expense),    icon: <IconDollar size={14} />, color: 'text-lz-danger' },
                  { label: 'Utilidad',      value: fmtCurrency(insights.financial.net),        icon: <IconDollar size={14} />, color: insights.financial.net >= 0 ? 'text-lz-success' : 'text-lz-danger' },
                  { label: 'Sin stock',     value: String(insights.inventory.outOfStock),      icon: <IconBox    size={14} />, color: insights.inventory.outOfStock > 0 ? 'text-lz-danger' : 'text-lz-muted' },
                  { label: 'Bajo stock',    value: String(insights.inventory.lowStock),        icon: <IconBox    size={14} />, color: insights.inventory.lowStock > 0 ? 'text-lz-warning' : 'text-lz-muted' },
                  { label: 'En tránsito',   value: String(insights.imports.inTransit),         icon: <IconUsers  size={14} />, color: 'text-lz-info' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lz-muted">{icon}<span className="text-xs">{label}</span></div>
                    <span className={['text-sm font-semibold tabular-nums', color].join(' ')}>{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Opportunities */}
          {insights.opportunities.length > 0 && (
            <Card padding={false}>
              <CardHeader>
                <p className="text-sm font-semibold text-lz-text">Oportunidades</p>
                <Badge variant="success">{insights.opportunities.length}</Badge>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {insights.opportunities.map((o, i) => (
                    <li key={i} className="flex gap-2 text-xs text-lz-muted">
                      <span className="shrink-0 text-lz-success">↑</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <Card padding={false}>
              <CardHeader><p className="text-sm font-semibold text-lz-text">Recomendaciones</p></CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {insights.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs text-lz-muted">
                      <span className="shrink-0 text-lz-accent">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function AiPage() {
  await verifySession()
  const canRead = await checkPermission('ai.read')
  if (!canRead) redirect('/admin')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Inteligencia Artificial"
        description="Alertas, predicciones y recomendaciones basadas en los datos del negocio."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'IA' }]}
      />

      {/* Module grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AI_MODULES.map(({ label, href, desc, icon }) => (
          <Link key={href} href={href}
            className="group rounded-xl border border-lz-border bg-lz-surface p-4 transition-colors hover:border-lz-primary/40"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <p className="text-sm font-semibold text-lz-text group-hover:text-lz-accent">{label}</p>
            </div>
            <p className="mt-1 text-[11px] text-lz-muted">{desc}</p>
          </Link>
        ))}
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}
        </div>
      }>
        <AIDashboard />
      </Suspense>
    </div>
  )
}
