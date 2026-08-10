import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSalesReport } from '@/features/reports/data/sales'
import { fmtCurrency } from '@/features/reports/data/period'
import { PeriodFilter } from '@/features/reports/components/period-filter'
import { KpiGrid }      from '@/features/reports/components/kpi-grid'
import { ReportSection } from '@/features/reports/components/report-section'
import { ExportCSV }    from '@/features/reports/components/export-csv'
import { BarChart }     from '@/components/ui/bar-chart'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { EmptyState }   from '@/components/ui/empty-state'
import { IconCart }     from '@/components/icons'

export const metadata: Metadata = { title: 'Reporte de ventas' }

type Props = { searchParams: Promise<{ period?: string; from?: string; to?: string }> }

export default async function SalesReportPage({ searchParams }: Props) {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.sales.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const sp   = await searchParams
  const data = await getSalesReport(sp.period ?? 'month', sp.from, sp.to)

  const kpis = [
    { label: 'Ingresos',            value: fmtCurrency(data.revenue),         color: 'success' as const },
    { label: 'Pedidos completados', value: String(data.completedCount),        color: 'default' as const },
    { label: 'Pedidos cancelados',  value: String(data.cancelledCount),        color: data.cancelledCount > 0 ? 'warning' as const : 'muted' as const },
    { label: 'Total pedidos',       value: String(data.totalOrders),           color: 'default' as const },
    { label: 'Ticket promedio',     value: fmtCurrency(data.avgTicket),        color: 'default' as const },
    { label: 'Período',             value: data.label,                         color: 'muted' as const },
  ]

  const exportRows = data.topProducts.map((p) => ({
    Producto: p.name,
    SKU:      p.sku,
    Cantidad: p.qty,
    Ingresos: p.revenue.toFixed(2),
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte de ventas"
        description={`${data.from} → ${data.to}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Ventas' },
        ]}
        actions={canExport ? <ExportCSV filename={`ventas-${data.from}`} rows={exportRows} /> : undefined}
      />

      <PeriodFilter />

      <KpiGrid items={kpis} cols={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily chart */}
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Ventas por día</p></CardHeader>
          <CardBody>
            {data.dailySeries.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin ventas en el período.</p>
            ) : (
              <BarChart data={data.dailySeries} formatValue={(v) => fmtCurrency(v)} />
            )}
          </CardBody>
        </Card>

        {/* Top products */}
        <ReportSection title="Productos más vendidos" subtitle="Por ingresos en el período">
          {data.topProducts.length === 0 ? (
            <EmptyState icon={<IconCart size={20} className="text-lz-muted" />} title="Sin ventas" description="No hay pedidos completados en el período." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Producto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cant.</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {data.topProducts.map((p) => (
                    <tr key={p.sku} className="hover:bg-lz-surface/60">
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-lz-text">{p.name}</p>
                        <p className="font-mono text-[11px] text-lz-muted">{p.sku}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm">{p.qty}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-lz-success">
                        {fmtCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>
      </div>

      {/* Channel and payment breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By channel */}
        <ReportSection title="Ventas por canal" subtitle="Ingresos y pedidos por canal de origen">
          {data.channelSeries.length === 0 ? (
            <EmptyState icon={<IconCart size={20} className="text-lz-muted" />} title="Sin datos" description="No hay ventas completadas en el período." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Canal</th>
                    <th className="px-4 py-2.5 text-right font-medium">Pedidos</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                    <th className="px-4 py-2.5 text-right font-medium hidden sm:table-cell">Ticket prom.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {data.channelSeries.map((c) => (
                    <tr key={c.label} className="hover:bg-lz-surface/60">
                      <td className="px-4 py-2.5 text-sm text-lz-text">{c.label}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm">{c.count}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-lz-success">
                        {fmtCurrency(c.value)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm text-lz-muted hidden sm:table-cell">
                        {fmtCurrency(c.count > 0 ? c.value / c.count : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>

        {/* By payment method */}
        <ReportSection title="Ventas por método de pago" subtitle="Ingresos por método de cobro registrado">
          {data.paymentSeries.length === 0 ? (
            <EmptyState icon={<IconCart size={20} className="text-lz-muted" />} title="Sin datos" description="No hay ventas con método de pago registrado." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Método</th>
                    <th className="px-4 py-2.5 text-right font-medium">Pedidos</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {data.paymentSeries.map((p) => (
                    <tr key={p.label} className="hover:bg-lz-surface/60">
                      <td className="px-4 py-2.5 text-sm text-lz-text">{p.label}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm">{p.count}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-lz-success">
                        {fmtCurrency(p.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>
      </div>
    </div>
  )
}
