import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getRevenueMetrics,
  getOrderFunnel,
  getTopProducts,
  getCategoryPerformance,
  getUnsoldProducts,
} from '@/features/analytics/data/business-metrics'
import { getEventSummary, getRecentEvents } from '@/features/analytics/data/store-events'
import { fmtCurrency, getPeriodDates } from '@/features/reports/data/period'
import { PageHeader }  from '@/components/ui/page-header'
import { StatCard }    from '@/components/ui/stat-card'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { BarChart }    from '@/components/ui/bar-chart'
import { IconBar, IconCart, IconDollar, IconBox, IconUsers } from '@/components/icons'

export const metadata: Metadata = { title: 'Analítica de la tienda' }

type Props = { searchParams: Promise<{ period?: string }> }

function pct(n: number) { return `${n.toFixed(1)}%` }

function FunnelBar({ label, count, pct: p, isLast = false }: { label: string; count: number; pct: number; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 text-right text-xs text-lz-muted">{label}</div>
      <div className="flex-1">
        <div className="flex h-7 overflow-hidden rounded-lg bg-lz-surface border border-lz-border">
          <div
            className={`flex h-full items-center px-2 text-[10px] font-semibold text-white transition-all ${isLast ? 'bg-lz-success' : 'bg-lz-primary'}`}
            style={{ width: `${Math.max(p, 2)}%` }}
          >
            {count > 0 ? count : ''}
          </div>
        </div>
      </div>
      <div className="w-12 shrink-0 text-right text-xs font-semibold text-lz-text">{pct(p)}</div>
    </div>
  )
}

export default async function AnalyticsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('marketing.analytics.read')
  if (!canRead) redirect('/admin')

  const sp     = await searchParams
  const period = sp.period ?? 'month'

  const [revenue, funnel, topProducts, categories, unsold, eventSummary, recentEvents] = await Promise.all([
    getRevenueMetrics(period).catch(() => ({
      totalOrders: 0, completedOrders: 0, cancelledOrders: 0,
      revenue: 0, avgTicket: 0, conversionRate: 0,
    })),
    getOrderFunnel(period).catch(() => []),
    getTopProducts(period, 8).catch(() => []),
    getCategoryPerformance(period).catch(() => []),
    getUnsoldProducts(8).catch(() => []),
    getEventSummary(30).catch(() => []),
    getRecentEvents(10).catch(() => []),
  ])

  const periodLabel = ({ month: 'este mes', week: 'esta semana', year: 'este año' } as Record<string, string>)[period] ?? 'período actual'
  const { from, to } = getPeriodDates(period)

  const PERIODS = [
    { value: 'week',  label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year',  label: 'Año' },
  ]

  const topBarData = topProducts.slice(0, 6).map(p => ({
    label: p.productSku,
    value: p.revenue,
    color: 'primary' as const,
  }))

  const totalPageViews = eventSummary
    .filter(e => e.eventType.startsWith('page_'))
    .reduce((s, e) => s + e.count, 0)
  const addToCartEvents  = eventSummary.find(e => e.eventType === 'add_to_cart')?.count ?? 0
  const checkoutStarted  = eventSummary.find(e => e.eventType === 'checkout_started')?.count ?? 0
  const ordersCompleted  = eventSummary.find(e => e.eventType === 'checkout_completed')?.count ?? 0
  const whatsappClicks   = eventSummary.find(e => e.eventType === 'whatsapp_clicked')?.count ?? 0

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Analítica de la tienda"
        description={`Métricas comerciales y de comportamiento — ${periodLabel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Analítica' },
        ]}
        secondaryActions={
          <div className="flex items-center gap-1 rounded-xl border border-lz-border bg-lz-surface p-1">
            {PERIODS.map(p => (
              <Link
                key={p.value}
                href={`?period=${p.value}`}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p.value
                    ? 'bg-lz-primary text-white'
                    : 'text-lz-muted hover:text-lz-text',
                ].join(' ')}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      {/* ── Revenue KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos del período"
          value={fmtCurrency(revenue.revenue)}
          helperText={`${revenue.completedOrders} pedidos entregados`}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Total pedidos"
          value={String(revenue.totalOrders)}
          helperText={`${revenue.cancelledOrders} cancelados`}
          icon={<IconCart size={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={revenue.avgTicket > 0 ? fmtCurrency(revenue.avgTicket) : '—'}
          helperText="Pedidos entregados"
          icon={<IconBar size={18} />}
        />
        <StatCard
          label="Tasa de conversión"
          value={revenue.totalOrders > 0 ? pct(revenue.conversionRate) : '—'}
          helperText="Pedidos entregados / total"
          icon={<IconUsers size={18} />}
        />
      </div>

      {/* ── Store events KPIs (from store_events table) ──────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Páginas vistas',   value: totalPageViews, color: 'text-lz-info' },
          { label: 'Add to cart',      value: addToCartEvents, color: 'text-lz-primary' },
          { label: 'Checkout iniciado', value: checkoutStarted, color: 'text-lz-warning' },
          { label: 'Pedidos completados', value: ordersCompleted, color: 'text-lz-success' },
          { label: 'Clics WhatsApp',   value: whatsappClicks, color: 'text-[#25D366]' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-lz-border bg-lz-surface p-4">
            <p className="text-xs text-lz-muted">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {totalPageViews === 0 && (
        <div className="rounded-xl border border-lz-warning/30 bg-lz-warning/10 px-4 py-3">
          <p className="text-xs font-semibold text-lz-warning">Instrumentación pendiente</p>
          <p className="mt-0.5 text-xs text-lz-muted">
            Los eventos de comportamiento del cliente (visitas, carrito) estarán disponibles una vez que se agreguen las llamadas de tracking a las páginas de la tienda.
            La tabla <code className="rounded bg-lz-border px-1 font-mono">store_events</code> ya está lista para recibir datos.
          </p>
        </div>
      )}

      {/* ── Embudo de conversión (órdenes) + Top products ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Funnel */}
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Embudo de pedidos</p>
              <p className="mt-0.5 text-xs text-lz-muted">{new Date(from).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} — {new Date(to).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
            </div>
          </CardHeader>
          <CardBody>
            {funnel.every(s => s.count === 0) ? (
              <EmptyState
                icon={<IconCart size={20} className="text-lz-muted" />}
                title="Sin pedidos en este período"
                description="Los pedidos aparecerán aquí en cuanto se registren."
              />
            ) : (
              <div className="space-y-2">
                {funnel.map((step, i) => (
                  <FunnelBar
                    key={step.status}
                    label={step.label}
                    count={step.count}
                    pct={step.pct}
                    isLast={i === funnel.length - 1}
                  />
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top products chart */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Productos por ingresos</p>
          </CardHeader>
          <CardBody>
            {topBarData.length === 0 ? (
              <EmptyState
                icon={<IconBox size={20} className="text-lz-muted" />}
                title="Sin ventas en este período"
                description="Los productos más vendidos aparecerán aquí."
              />
            ) : (
              <BarChart data={topBarData} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Top products table ────────────────────────────────────────────── */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Rendimiento por producto</p>
        </CardHeader>
        {topProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<IconBox size={20} className="text-lz-muted" />}
              title="Sin datos de ventas"
              description="Registra pedidos para ver el rendimiento por producto."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['Producto', 'SKU', 'Unidades', 'Pedidos', 'Ingresos'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${h !== 'Producto' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {topProducts.map((p, i) => (
                  <tr key={p.productSku} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lz-primary/15 text-[10px] font-bold text-lz-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-lz-text">{p.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-lz-muted">{p.productSku}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{p.unitsSold}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{p.orderCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-lz-text">{fmtCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Category performance + Unsold products ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Categories */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Rendimiento por categoría</p>
          </CardHeader>
          <CardBody>
            {categories.length === 0 ? (
              <EmptyState
                icon={<IconBox size={20} className="text-lz-muted" />}
                title="Sin datos de categorías"
                description="Aparecerá aquí una vez que haya ventas registradas."
              />
            ) : (
              <div className="space-y-3">
                {categories.map(cat => {
                  const maxRev = categories[0].revenue
                  const pctVal = maxRev > 0 ? (cat.revenue / maxRev) * 100 : 0
                  return (
                    <div key={cat.categoryName}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-lz-text">{cat.categoryName}</span>
                        <span className="tabular-nums text-lz-muted">{fmtCurrency(cat.revenue)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-lz-border">
                        <div className="h-full rounded-full bg-lz-primary transition-all" style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Unsold products */}
        <Card padding={false}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-lz-text">Productos sin ventas</p>
              {unsold.length > 0 && (
                <Badge variant="warning">{unsold.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {unsold.length === 0 ? (
              <p className="text-sm text-lz-success">✓ Todos los productos publicados tienen al menos una venta.</p>
            ) : (
              <div className="space-y-2">
                {unsold.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-lz-border bg-lz-bg px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-lz-text">{p.name}</p>
                      <p className="font-mono text-[10px] text-lz-muted">{p.sku}</p>
                    </div>
                    <span className="shrink-0 tabular-nums text-xs text-lz-muted">{fmtCurrency(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Store events table ────────────────────────────────────────────── */}
      <Card padding={false}>
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-lz-text">Desglose de eventos (últimos 30 días)</p>
            <p className="mt-0.5 text-xs text-lz-muted">Requiere instrumentación de la tienda para datos reales.</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {eventSummary.map(ev => (
              <div key={ev.eventType} className="rounded-xl border border-lz-border bg-lz-bg px-3 py-2.5">
                <p className="text-[10px] text-lz-muted">{ev.label}</p>
                <p className={`mt-0.5 text-lg font-bold tabular-nums ${ev.count > 0 ? 'text-lz-text' : 'text-lz-border'}`}>
                  {ev.count}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Recent events log ────────────────────────────────────────────── */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Eventos recientes</p>
        </CardHeader>
        {recentEvents.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<IconBar size={20} className="text-lz-muted" />}
              title="Sin eventos registrados"
              description="Los eventos de la tienda aparecerán aquí en tiempo real una vez instrumentadas las páginas."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['Evento', 'Ruta', 'Sesión', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {recentEvents.map(ev => (
                  <tr key={ev.id} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{ev.event_type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-lz-muted">{ev.page_path ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-lz-muted">{ev.session_id?.slice(0, 8) ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-lz-muted">
                      {new Date(ev.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
