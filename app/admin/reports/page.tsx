import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSalesReport }    from '@/features/reports/data/sales'
import { getInventoryReport } from '@/features/reports/data/inventory'
import { getFinanceReport }   from '@/features/reports/data/finance'
import { getImportsReport }   from '@/features/reports/data/imports-report'
import { fmtCurrency, fmtPct } from '@/features/reports/data/period'
import { KpiGrid }      from '@/features/reports/components/kpi-grid'
import { BarChart }     from '@/components/ui/bar-chart'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard }     from '@/components/ui/stat-card'
import { IconDollar, IconBox, IconCart } from '@/components/icons'

export const metadata: Metadata = { title: 'Reportes ejecutivos' }

const REPORTS = [
  { label: 'Ventas',        href: '/admin/reports/sales',     description: 'Ingresos, pedidos y ticket promedio' },
  { label: 'Inventario',    href: '/admin/reports/inventory',  description: 'Stock, valor y rotación' },
  { label: 'Finanzas',      href: '/admin/reports/finance',    description: 'Ingresos, gastos y utilidad' },
  { label: 'Importaciones', href: '/admin/reports/imports',    description: 'Costos logísticos y tránsito' },
  { label: 'Clientes',      href: '/admin/reports/customers',  description: 'Segmentación y comportamiento' },
  { label: 'Marketing',     href: '/admin/reports/marketing',  description: 'Campañas, cupones y conversiones' },
]

async function ExecutiveDashboard() {
  const [sales, inv, fin, imp] = await Promise.all([
    getSalesReport('today'),
    getInventoryReport(),
    getFinanceReport('month'),
    getImportsReport(),
  ])

  const roi = fin.income > 0 ? ((fin.income - fin.expense) / Math.max(fin.expense, 1)) * 100 : 0

  const kpis = [
    { label: 'Ventas del día',       value: fmtCurrency(sales.revenue),         color: 'success' as const },
    { label: 'Ventas del mes',       value: fmtCurrency(fin.income),             color: 'success' as const },
    { label: 'Utilidad neta',        value: fmtCurrency(fin.netProfit),          color: fin.netProfit >= 0 ? 'success' as const : 'danger' as const },
    { label: 'Flujo de caja',        value: fmtCurrency(fin.totalCash),          color: 'default' as const },
    { label: 'Valor inventario',     value: fmtCurrency(inv.totalValue),         color: 'default' as const },
    { label: 'Productos vendidos',   value: String(sales.completedCount),        color: 'default' as const },
    { label: 'ROI del mes',          value: fmtPct(roi),                         color: roi >= 0 ? 'success' as const : 'danger' as const },
    { label: 'Margen neto',          value: fmtPct(fin.netMargin),               color: fin.netMargin >= 0 ? 'success' as const : 'danger' as const },
  ]

  return (
    <div className="space-y-6">
      <KpiGrid items={kpis} cols={4} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly sales trend */}
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Ingresos mensuales</p></CardHeader>
          <CardBody>
            {fin.monthlySeries.every((d) => d.value === 0) ? (
              <p className="text-sm text-lz-muted">Sin datos de transacciones.</p>
            ) : (
              <BarChart data={fin.monthlySeries} formatValue={(v) => fmtCurrency(v)} />
            )}
          </CardBody>
        </Card>

        {/* Expense by category */}
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Gastos por categoría</p></CardHeader>
          <CardBody>
            {fin.expenseSeries.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin gastos registrados.</p>
            ) : (
              <div className="space-y-2">
                {fin.expenseSeries.slice(0, 6).map(({ label, value }) => {
                  const pct = fin.expense > 0 ? (value / fin.expense) * 100 : 0
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs">
                        <span className="text-lz-text truncate">{label}</span>
                        <span className="tabular-nums text-lz-muted ml-2">{fmtPct(pct)}</span>
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

        {/* Inventory & imports summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sin stock"   value={String(inv.outOfStockCount)}   icon={<IconBox  size={16} />} />
            <StatCard label="Bajo stock"  value={String(inv.lowStockCount)}     icon={<IconBox  size={16} />} />
            <StatCard label="En tránsito" value={String(imp.inTransitCount)}    icon={<IconCart size={16} />} />
            <StatCard label="Costo log."  value={fmtCurrency(imp.totalLogCost)} icon={<IconDollar size={16} />} />
          </div>
        </div>
      </div>

      {/* Quick sales chart */}
      {sales.dailySeries.length > 0 && (
        <Card padding={false}>
          <CardHeader><p className="text-sm font-semibold text-lz-text">Ventas del mes — por día</p></CardHeader>
          <CardBody>
            <BarChart data={sales.dailySeries} formatValue={(v) => fmtCurrency(v)} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default async function ReportsPage() {
  await verifySession()
  const canRead = await checkPermission('reports.read')
  if (!canRead) redirect('/admin')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reportes ejecutivos"
        description="Centro de análisis consolidado de Lanz Technology."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Reportes' }]}
      />

      {/* Module grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {REPORTS.map(({ label, href, description }) => (
          <Link key={href} href={href}
            className="group rounded-xl border border-lz-border bg-lz-surface p-4 transition-colors hover:border-lz-primary/40"
          >
            <p className="text-sm font-semibold text-lz-text group-hover:text-lz-accent">{label}</p>
            <p className="mt-1 text-[11px] text-lz-muted">{description}</p>
          </Link>
        ))}
      </div>

      <Suspense fallback={<KpiGrid items={Array.from({ length: 8 }, () => ({ label: '', value: '…' }))} cols={4} />}>
        <ExecutiveDashboard />
      </Suspense>
    </div>
  )
}
