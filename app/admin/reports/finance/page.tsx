import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getFinanceReport } from '@/features/reports/data/finance'
import { fmtCurrency, fmtPct } from '@/features/reports/data/period'
import { PeriodFilter }  from '@/features/reports/components/period-filter'
import { KpiGrid }       from '@/features/reports/components/kpi-grid'
import { ExportCSV }     from '@/features/reports/components/export-csv'
import { BarChart }      from '@/components/ui/bar-chart'
import { PageHeader }    from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Reporte financiero' }

type Props = { searchParams: Promise<{ period?: string; from?: string; to?: string }> }

export default async function FinanceReportPage({ searchParams }: Props) {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.finance.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const sp   = await searchParams
  const data = await getFinanceReport(sp.period ?? 'month', sp.from, sp.to)

  const roi = data.expense > 0 ? ((data.income - data.expense) / data.expense) * 100 : 0

  const kpis = [
    { label: 'Ingresos',            value: fmtCurrency(data.income),           color: 'success' as const },
    { label: 'Gastos',              value: fmtCurrency(data.expense),           color: 'danger'  as const },
    { label: 'Utilidad bruta',      value: fmtCurrency(data.netProfit),         color: data.netProfit >= 0 ? 'success' as const : 'danger' as const },
    { label: 'Utilidad neta',       value: fmtCurrency(data.netProfit),         color: data.netProfit >= 0 ? 'success' as const : 'danger' as const },
    { label: 'Margen neto',         value: fmtPct(data.netMargin),              color: data.netMargin >= 0 ? 'success' as const : 'danger' as const },
    { label: 'ROI',                 value: fmtPct(roi),                         color: roi >= 0 ? 'success' as const : 'danger' as const },
    { label: 'Flujo de caja',       value: fmtCurrency(data.totalCash),         color: 'default' as const },
    { label: 'Cuentas por pagar',   value: fmtCurrency(data.totalPayables),     color: data.totalPayables > 0 ? 'warning' as const : 'muted' as const },
    { label: 'Cuentas por cobrar',  value: fmtCurrency(data.totalReceivables),  color: data.totalReceivables > 0 ? 'info' as const : 'muted' as const },
  ]

  const exportRows = data.monthlySeries.map((m) => ({
    Mes:       m.label,
    Ingresos:  m.value.toFixed(2),
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte financiero"
        description={data.label}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Finanzas' },
        ]}
        actions={canExport ? <ExportCSV filename={`finanzas-${data.from}`} rows={exportRows} /> : undefined}
      />

      <PeriodFilter />

      <KpiGrid items={kpis} cols={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Ingresos mensuales</p></CardHeader>
          <CardBody>
            {data.monthlySeries.every((d) => d.value === 0) ? (
              <p className="text-sm text-lz-muted">Sin ingresos registrados.</p>
            ) : (
              <BarChart data={data.monthlySeries} formatValue={(v) => fmtCurrency(v)} />
            )}
          </CardBody>
        </Card>

        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Gastos por categoría</p></CardHeader>
          <CardBody>
            {data.expenseSeries.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin gastos en el período.</p>
            ) : (
              <div className="space-y-3">
                {data.expenseSeries.map(({ label, value }) => {
                  const pct = data.expense > 0 ? (value / data.expense) * 100 : 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs">
                        <span className="text-lz-text">{label}</span>
                        <span className="tabular-nums text-lz-muted">{fmtCurrency(value)} · {fmtPct(pct)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lz-border">
                        <div className="h-full rounded-full bg-lz-danger" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
