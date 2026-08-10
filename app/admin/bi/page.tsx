import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSalesReport }    from '@/features/reports/data/sales'
import { getFinanceReport }  from '@/features/reports/data/finance'
import { getInventoryReport } from '@/features/reports/data/inventory'
import { getCustomersReport } from '@/features/reports/data/customers-report'
import { getPeriodDates, fmtCurrency, fmtPct } from '@/features/reports/data/period'
import { PageHeader }  from '@/components/ui/page-header'
import { StatCard }    from '@/components/ui/stat-card'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { BarChart }    from '@/components/ui/bar-chart'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconDollar, IconCart, IconBox, IconUsers, IconBar } from '@/components/icons'

export const metadata: Metadata = { title: 'Centro de Inteligencia' }

type Props = { searchParams: Promise<{ period?: string }> }

function Delta({ pct }: { pct: number }) {
  if (isNaN(pct) || !isFinite(pct)) return <span className="text-xs text-lz-muted">—</span>
  const up = pct >= 0
  return (
    <span className={`text-xs font-semibold ${up ? 'text-lz-success' : 'text-lz-danger'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// Previous month dates helper
function prevMonthDates() {
  const now  = new Date()
  const y    = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const m    = now.getMonth() === 0 ? 12 : now.getMonth()
  const last = new Date(y, m, 0).getDate()
  const mm   = String(m).padStart(2, '0')
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` }
}

const REPORT_LINKS = [
  { label: 'Rentabilidad',  href: '/admin/bi/products',   desc: 'Margen por producto' },
  { label: 'Proveedores',   href: '/admin/bi/suppliers',  desc: 'Volumen y costo' },
  { label: 'Ventas',        href: '/admin/reports/sales',      desc: 'Ingresos y pedidos' },
  { label: 'Inventario',    href: '/admin/reports/inventory',  desc: 'Stock y rotación' },
  { label: 'Finanzas',      href: '/admin/reports/finance',    desc: 'Flujo y métricas' },
  { label: 'Clientes',      href: '/admin/reports/customers',  desc: 'Engagement y valor' },
] as const

export default async function BIPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('reports.sales.read')
  if (!canRead) redirect('/admin')

  const sp     = await searchParams
  const period = sp.period ?? 'month'

  const prev = prevMonthDates()

  const [sales, prevSales, finance, prevFinance, inventory, customers] = await Promise.all([
    getSalesReport(period).catch(() => null),
    getSalesReport('custom', prev.from, prev.to).catch(() => null),
    getFinanceReport(period).catch(() => null),
    getFinanceReport('custom', prev.from, prev.to).catch(() => null),
    getInventoryReport().catch(() => null),
    getCustomersReport().catch(() => null),
  ])

  const revDelta   = prevSales?.revenue      && prevSales.revenue > 0
    ? ((sales?.revenue ?? 0) - prevSales.revenue) / prevSales.revenue * 100
    : NaN
  const orderDelta = prevSales?.completedCount && prevSales.completedCount > 0
    ? ((sales?.completedCount ?? 0) - prevSales.completedCount) / prevSales.completedCount * 100
    : NaN
  const profitDelta = prevFinance?.netProfit && prevFinance.netProfit > 0
    ? ((finance?.netProfit ?? 0) - prevFinance.netProfit) / prevFinance.netProfit * 100
    : NaN

  const PERIODS = [
    { value: 'week',  label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year',  label: 'Año' },
  ]

  const { label: periodLabel } = getPeriodDates(period)

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Centro de Inteligencia Empresarial"
        description={`Métricas consolidadas — ${periodLabel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Inteligencia' },
        ]}
        secondaryActions={
          <div className="flex items-center gap-1 rounded-xl border border-lz-border bg-lz-surface p-1">
            {PERIODS.map(p => (
              <Link
                key={p.value}
                href={`?period=${p.value}`}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p.value ? 'bg-lz-primary text-white' : 'text-lz-muted hover:text-lz-text',
                ].join(' ')}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      {/* ── KPI grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={fmtCurrency(sales?.revenue ?? 0)}
          helperText="Pedidos activos"
          icon={<IconDollar size={18} />}
          badge={<Delta pct={revDelta} />}
        />
        <StatCard
          label="Pedidos completados"
          value={String(sales?.completedCount ?? 0)}
          helperText={`${sales?.cancelledCount ?? 0} cancelados`}
          icon={<IconCart size={18} />}
          badge={<Delta pct={orderDelta} />}
        />
        <StatCard
          label="Utilidad bruta"
          value={fmtCurrency(finance?.netProfit ?? 0)}
          helperText={`Margen ${fmtPct(finance?.netMargin ?? 0)}`}
          icon={<IconBar size={18} />}
          badge={<Delta pct={profitDelta} />}
        />
        <StatCard
          label="Flujo de caja"
          value={fmtCurrency(finance?.totalCash ?? 0)}
          helperText={`${fmtCurrency(finance?.totalReceivables ?? 0)} por cobrar`}
          icon={<IconDollar size={18} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Inventario valorizado"
          value={fmtCurrency(inventory?.totalValue ?? 0)}
          helperText={`${inventory?.totalProducts ?? 0} productos`}
          icon={<IconBox size={18} />}
        />
        <StatCard
          label="Sin stock"
          value={String(inventory?.outOfStockCount ?? 0)}
          helperText={`${inventory?.lowStockCount ?? 0} bajo mínimo`}
          icon={<IconBox size={18} />}
        />
        <StatCard
          label="Clientes activos"
          value={String(customers?.totalCustomers ?? 0)}
          helperText={`${customers?.newThisMonth ?? 0} nuevos este mes`}
          icon={<IconUsers size={18} />}
        />
        <StatCard
          label="Ticket promedio"
          value={customers?.avgTicket ? fmtCurrency(customers.avgTicket) : '—'}
          helperText={`${customers?.recurringCount ?? 0} recurrentes`}
          icon={<IconUsers size={18} />}
        />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales trend */}
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Ventas por día</p>
              <p className="mt-0.5 text-xs text-lz-muted">{periodLabel}</p>
            </div>
          </CardHeader>
          <CardBody>
            {(sales?.dailySeries ?? []).length === 0 ? (
              <EmptyState icon={<IconBar size={18} className="text-lz-muted" />} title="Sin datos de ventas" description="" />
            ) : (
              <BarChart data={sales!.dailySeries.slice(-14)} />
            )}
          </CardBody>
        </Card>

        {/* Finance breakdown */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Gastos por categoría</p>
          </CardHeader>
          <CardBody>
            {(finance?.expenseSeries ?? []).length === 0 ? (
              <EmptyState icon={<IconBar size={18} className="text-lz-muted" />} title="Sin gastos registrados" description="" />
            ) : (
              <BarChart data={finance!.expenseSeries} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Monthly trend ─────────────────────────────────────────────────── */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Tendencia de ingresos (6 meses)</p>
        </CardHeader>
        <CardBody>
          {(finance?.monthlySeries ?? []).length === 0 ? (
            <EmptyState icon={<IconBar size={18} className="text-lz-muted" />} title="Sin datos financieros" description="" />
          ) : (
            <BarChart data={finance!.monthlySeries} />
          )}
        </CardBody>
      </Card>

      {/* ── M/M comparison ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            label:   'Ingresos',
            current: sales?.revenue ?? 0,
            prev:    prevSales?.revenue ?? 0,
            fmt:     fmtCurrency,
          },
          {
            label:   'Utilidad neta',
            current: finance?.netProfit ?? 0,
            prev:    prevFinance?.netProfit ?? 0,
            fmt:     fmtCurrency,
          },
          {
            label:   'Pedidos',
            current: sales?.completedCount ?? 0,
            prev:    prevSales?.completedCount ?? 0,
            fmt:     (v: number) => String(v),
          },
        ].map(({ label, current, prev, fmt }) => {
          const delta = prev > 0 ? ((current - prev) / prev) * 100 : NaN
          const up    = delta >= 0
          return (
            <Card key={label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">{label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-lz-text">{fmt(current)}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-xs font-semibold ${isNaN(delta) ? 'text-lz-muted' : up ? 'text-lz-success' : 'text-lz-danger'}`}>
                  {isNaN(delta) ? '—' : `${up ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%`}
                </span>
                <span className="text-xs text-lz-muted">vs mes anterior ({fmt(prev)})</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Top products ─────────────────────────────────────────────────── */}
      <Card padding={false}>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm font-semibold text-lz-text">Top productos por ingresos</p>
            <Link href="/admin/bi/products" className="text-xs text-lz-primary hover:underline">
              Ver rentabilidad completa →
            </Link>
          </div>
        </CardHeader>
        {(sales?.topProducts ?? []).length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<IconBox size={18} className="text-lz-muted" />} title="Sin ventas" description="" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['#', 'Producto', 'SKU', 'Unidades', 'Ingresos'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${h === 'Producto' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {sales!.topProducts.slice(0, 6).map((p, i) => (
                  <tr key={p.sku} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3 text-right text-xs text-lz-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-lz-text">{p.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-lz-muted">{p.sku}</td>
                    <td className="px-4 py-3 text-right text-xs">{p.qty}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Report links ──────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-muted">Módulos de análisis</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {REPORT_LINKS.map(r => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-xl border border-lz-border bg-lz-surface px-4 py-3 transition-all hover:border-lz-primary/40 hover:shadow-[0_2px_12px_rgba(123,47,255,0.1)]"
            >
              <p className="text-xs font-semibold text-lz-text">{r.label}</p>
              <p className="mt-0.5 text-[10px] text-lz-muted">{r.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
