import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportsReport } from '@/features/reports/data/imports-report'
import { fmtCurrency } from '@/features/reports/data/period'
import { KpiGrid }       from '@/features/reports/components/kpi-grid'
import { ReportSection } from '@/features/reports/components/report-section'
import { ExportCSV }     from '@/features/reports/components/export-csv'
import { PageHeader }    from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Reporte de importaciones' }

export default async function ImportsReportPage() {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const data = await getImportsReport()

  const kpis = [
    { label: 'Total importaciones', value: String(data.totalImports),    color: 'default' as const },
    { label: 'Activas',             value: String(data.activeCount),      color: data.activeCount > 0 ? 'info' as const : 'muted' as const },
    { label: 'En tránsito',         value: String(data.inTransitCount),   color: data.inTransitCount > 0 ? 'warning' as const : 'muted' as const },
    { label: 'Completadas',         value: String(data.completedCount),   color: 'success' as const },
    { label: 'Costo logístico total', value: fmtCurrency(data.totalLogCost), color: 'default' as const },
    { label: 'Costo promedio',      value: fmtCurrency(data.avgCost),    color: 'default' as const },
  ]

  const exportRows = data.recentImports.map((i: { reference: string; status: string; origin_country: string; created_at: string }) => ({
    Referencia: i.reference,
    Estado:     i.status,
    Origen:     i.origin_country,
    Creado:     i.created_at.slice(0, 10),
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte de importaciones"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Importaciones' },
        ]}
        actions={canExport ? <ExportCSV filename="importaciones" rows={exportRows} /> : undefined}
      />

      <KpiGrid items={kpis} cols={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expense breakdown */}
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Costos por concepto</p></CardHeader>
          <CardBody>
            {data.byConcept.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin gastos de importación registrados.</p>
            ) : (
              <div className="space-y-3">
                {data.byConcept.map(([concept, amount]) => {
                  const pct = data.totalLogCost > 0 ? (amount / data.totalLogCost) * 100 : 0
                  return (
                    <div key={concept}>
                      <div className="flex justify-between text-xs">
                        <span className="text-lz-text capitalize">{concept}</span>
                        <span className="tabular-nums text-lz-muted">{fmtCurrency(amount)} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lz-border">
                        <div className="h-full rounded-full bg-lz-warning" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top origin countries */}
        <ReportSection title="Países de origen" subtitle="Importaciones por origen">
          {data.topOrigins.length === 0 ? (
            <p className="text-sm text-lz-muted">Sin datos de origen.</p>
          ) : (
            <div className="space-y-2">
              {data.topOrigins.map(([country, count]) => {
                const pct = data.totalImports > 0 ? (count / data.totalImports) * 100 : 0
                return (
                  <div key={country}>
                    <div className="flex justify-between text-xs">
                      <span className="text-lz-text">{country}</span>
                      <span className="tabular-nums text-lz-muted">{count} importaciones · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lz-border">
                      <div className="h-full rounded-full bg-lz-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ReportSection>
      </div>

      {/* Recent imports table */}
      <ReportSection title="Importaciones recientes">
        <div className="overflow-hidden rounded-xl border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Referencia</th>
                <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Estado</th>
                <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Origen</th>
                <th className="px-4 py-2.5 text-right font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lz-border/50">
              {data.recentImports.map((i: { id: string; reference: string; status: string; origin_country: string; created_at: string }) => (
                <tr key={i.id} className="hover:bg-lz-surface/60">
                  <td className="px-4 py-2.5 font-mono text-sm text-lz-text">{i.reference}</td>
                  <td className="px-4 py-2.5 text-xs text-lz-muted hidden sm:table-cell capitalize">{i.status.replace('_',' ')}</td>
                  <td className="px-4 py-2.5 text-xs text-lz-muted hidden md:table-cell">{i.origin_country}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-lz-muted">{i.created_at.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>
    </div>
  )
}
