import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getProfitabilityData } from '@/features/finance/data/profitability'
import { getMonthlyTrend } from '@/features/finance/data/transactions'
import { TX_EXPENSE_CATEGORIES, PERIOD_OPTIONS } from '@/features/finance/data/constants'
import { BarChart } from '@/components/ui/bar-chart'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { IconDollar, IconBar } from '@/components/icons'

export const metadata: Metadata = { title: 'Rentabilidad' }

type Props = { searchParams: Promise<{ period?: string }> }

function fmt(v: number) {
  return `USD ${Math.abs(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`
}

export default async function ProfitabilityPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('finance.read')
  if (!canRead) redirect('/admin/finance')

  const sp     = await searchParams
  const period = sp.period ?? 'month'

  const [data, trend] = await Promise.all([
    getProfitabilityData(period),
    getMonthlyTrend(6),
  ])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period
  const hasData     = data.totalIncome > 0 || data.totalExpense > 0

  const trendIncome  = trend.map((t) => ({ label: t.month, value: t.income,  color: 'success' as const }))
  const trendExpense = trend.map((t) => ({ label: t.month, value: t.expense, color: 'danger'  as const }))

  const categoryData = Object.entries(data.byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, value]) => ({
      label: TX_EXPENSE_CATEGORIES[cat] ?? cat,
      value,
      color: 'danger' as const,
    }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Rentabilidad"
        description={`Período: ${periodLabel} · ${data.from} → ${data.to}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Finanzas',  href: '/admin/finance' },
          { label: 'Rentabilidad' },
        ]}
        actions={
          <form method="GET" className="flex items-center gap-2">
            <select
              name="period"
              defaultValue={period}
              onChange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}
              className="h-8 rounded-lg border border-lz-border bg-lz-surface px-3 text-xs text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
            >
              {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </form>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Ingresos totales"   value={fmt(data.totalIncome)}  icon={<IconDollar size={18} />} />
        <StatCard label="Gastos totales"     value={fmt(data.totalExpense)} icon={<IconBar    size={18} />} />
        <StatCard label="Utilidad bruta"     value={fmt(data.grossProfit)}  icon={<IconDollar size={18} />} />
        <StatCard label="Utilidad neta"      value={fmt(data.netProfit)}    icon={<IconDollar size={18} />} />
        <StatCard label="Margen neto"        value={fmtPct(data.netMargin)} helperText="(utilidad / ingresos) × 100" icon={<IconDollar size={18} />} />
        <StatCard label="ROI"                value={fmtPct(data.roi)}       helperText="(utilidad / inversión) × 100" icon={<IconDollar size={18} />} />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<IconDollar size={22} className="text-lz-muted" />}
          title="Sin datos en el período"
          description="Registra transacciones financieras para calcular la rentabilidad."
        />
      ) : (
        <>
          {/* Margin summary */}
          <Card>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-lz-text">{fmt(data.netProfit)}</p>
                <p className="mt-1 text-xs text-lz-muted">Beneficio neto = Ingresos − Gastos</p>
              </div>
              <div className="text-center">
                <p className={['text-2xl font-bold tabular-nums', data.netMargin >= 0 ? 'text-lz-success' : 'text-lz-danger'].join(' ')}>
                  {fmtPct(data.netMargin)}
                </p>
                <p className="mt-1 text-xs text-lz-muted">Margen neto</p>
              </div>
              <div className="text-center">
                <p className={['text-2xl font-bold tabular-nums', data.roi >= 0 ? 'text-lz-success' : 'text-lz-danger'].join(' ')}>
                  {fmtPct(data.roi)}
                </p>
                <p className="mt-1 text-xs text-lz-muted">ROI sobre inversión</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Monthly trend — income */}
            <Card padding={false}>
              <CardHeader>
                <p className="text-sm font-semibold text-lz-text">Ingresos — 6 meses</p>
              </CardHeader>
              <CardBody>
                {trendIncome.every((d) => d.value === 0) ? (
                  <p className="text-sm text-lz-muted">Sin ingresos registrados.</p>
                ) : (
                  <BarChart data={trendIncome} formatValue={fmt} />
                )}
              </CardBody>
            </Card>

            {/* Monthly trend — expense */}
            <Card padding={false}>
              <CardHeader>
                <p className="text-sm font-semibold text-lz-text">Egresos — 6 meses</p>
              </CardHeader>
              <CardBody>
                {trendExpense.every((d) => d.value === 0) ? (
                  <p className="text-sm text-lz-muted">Sin egresos registrados.</p>
                ) : (
                  <BarChart data={trendExpense} formatValue={fmt} />
                )}
              </CardBody>
            </Card>

            {/* Expense breakdown by category */}
            <Card padding={false}>
              <CardHeader>
                <p className="text-sm font-semibold text-lz-text">Egresos por categoría</p>
              </CardHeader>
              <CardBody>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-lz-muted">Sin egresos en el período.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryData.map(({ label, value }) => {
                      const pct = data.totalExpense > 0 ? (value / data.totalExpense) * 100 : 0
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs">
                            <span className="text-lz-text">{label}</span>
                            <span className="tabular-nums text-lz-muted">{fmtPct(pct)}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lz-border">
                            <div
                              className="h-full rounded-full bg-lz-danger"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
