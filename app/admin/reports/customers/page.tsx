import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCustomersReport } from '@/features/reports/data/customers-report'
import { fmtCurrency } from '@/features/reports/data/period'
import { KpiGrid }       from '@/features/reports/components/kpi-grid'
import { ReportSection } from '@/features/reports/components/report-section'
import { ExportCSV }     from '@/features/reports/components/export-csv'
import { PageHeader }    from '@/components/ui/page-header'
import { EmptyState }    from '@/components/ui/empty-state'
import { IconUsers }     from '@/components/icons'

export const metadata: Metadata = { title: 'Reporte de clientes' }

export default async function CustomersReportPage() {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const data = await getCustomersReport()

  const kpis = [
    { label: 'Total clientes',      value: String(data.totalCustomers),   color: 'default' as const },
    { label: 'Nuevos este mes',     value: String(data.newThisMonth),     color: 'success' as const },
    { label: 'Nuevos (30 días)',    value: String(data.newLast30),        color: 'info'    as const },
    { label: 'Clientes VIP',        value: String(data.vipCount),         color: 'warning' as const },
    { label: 'Clientes recurrentes', value: String(data.recurringCount),  color: 'success' as const },
    { label: 'Clientes inactivos',  value: String(data.inactiveCount),    color: data.inactiveCount > 0 ? 'warning' as const : 'muted' as const },
    { label: 'Ticket promedio',     value: fmtCurrency(data.avgTicket),   color: 'default' as const },
  ]

  const exportRows = data.topCustomers.map((c) => ({
    Cliente:       c.name,
    Pedidos:       c.orders,
    'Ingresos USD': c.revenue.toFixed(2),
    'Último pedido': c.lastOrder?.slice(0, 10) ?? '',
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte de clientes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Clientes' },
        ]}
        actions={canExport ? <ExportCSV filename="clientes" rows={exportRows} /> : undefined}
      />

      <KpiGrid items={kpis} cols={4} />

      <ReportSection
        title="Mejores clientes"
        subtitle="Por ingresos generados"
        actions={<ExportCSV filename="top-clientes" rows={exportRows} label="CSV" />}
      >
        {data.topCustomers.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={20} className="text-lz-muted" />}
            title="Sin datos de clientes"
            description="No hay pedidos completados con cliente asignado."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-lz-border">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">#</th>
                  <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2.5 text-right font-medium">Pedidos</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                  <th className="px-4 py-2.5 text-right font-medium hidden md:table-cell">Último pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {data.topCustomers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-lz-surface/60">
                    <td className="px-4 py-2.5 text-xs text-lz-muted">{i + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-lz-text">{c.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-sm">{c.orders}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-lz-success">{fmtCurrency(c.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-lz-muted hidden md:table-cell">
                      {c.lastOrder ? c.lastOrder.slice(0, 10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>
    </div>
  )
}
