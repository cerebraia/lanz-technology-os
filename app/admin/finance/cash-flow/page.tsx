import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCashFlowData } from '@/features/finance/data/cash-flow'
import { getAccountStats } from '@/features/finance/data/accounts'
import { PERIOD_OPTIONS } from '@/features/finance/data/constants'
import { BarChart } from '@/components/ui/bar-chart'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { IconDollar } from '@/components/icons'

export const metadata: Metadata = { title: 'Flujo de caja' }

type Props = { searchParams: Promise<{ period?: string }> }

function fmt(v: number) {
  return `USD ${Math.abs(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function CashFlowPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('finance.read')
  if (!canRead) redirect('/admin/finance')

  const sp     = await searchParams
  const period = sp.period ?? 'month'

  const [cf, accounts] = await Promise.all([
    getCashFlowData(period),
    getAccountStats(),
  ])

  const incomeData  = cf.daily.map((d) => ({ label: d.date.slice(5), value: d.income,  color: 'success' as const }))
  const expenseData = cf.daily.map((d) => ({ label: d.date.slice(5), value: d.expense, color: 'danger'  as const }))
  const netData     = cf.daily.map((d) => ({ label: d.date.slice(5), value: Math.abs(d.net), color: (d.net >= 0 ? 'success' : 'danger') as 'success' | 'danger' }))

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Flujo de caja"
        description={`Período: ${periodLabel} · ${cf.from} → ${cf.to}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Finanzas',  href: '/admin/finance' },
          { label: 'Flujo de caja' },
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Efectivo disponible"
          value={fmt(accounts.totalCash)}
          helperText={`${accounts.active} cuentas activas`}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Ingresos"
          value={fmt(cf.totalIncome)}
          helperText={periodLabel}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Egresos"
          value={fmt(cf.totalExpense)}
          helperText={periodLabel}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Flujo neto"
          value={(cf.net < 0 ? '-' : '') + fmt(cf.net)}
          helperText={cf.net >= 0 ? 'Positivo' : 'Negativo'}
          icon={<IconDollar size={18} />}
        />
      </div>

      {cf.daily.length === 0 ? (
        <EmptyState
          icon={<IconDollar size={22} className="text-lz-muted" />}
          title="Sin movimientos en el período"
          description="Registra transacciones financieras para ver el flujo de caja."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Ingresos diarios</p>
            </CardHeader>
            <CardBody>
              <BarChart data={incomeData} formatValue={fmt} />
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Egresos diarios</p>
            </CardHeader>
            <CardBody>
              <BarChart data={expenseData} formatValue={fmt} />
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Flujo neto diario</p>
            </CardHeader>
            <CardBody>
              <BarChart data={netData} formatValue={fmt} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Daily detail table */}
      {cf.daily.length > 0 && (
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Detalle por día</p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lz-border text-xs text-lz-muted">
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right font-medium">Ingresos</th>
                  <th className="px-4 py-2 text-right font-medium">Egresos</th>
                  <th className="px-4 py-2 text-right font-medium">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {cf.daily.map((d) => (
                  <tr key={d.date} className="hover:bg-lz-surface-hover/40">
                    <td className="px-4 py-2 text-lz-muted">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-lz-success">
                      {d.income > 0 ? fmt(d.income) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-lz-danger">
                      {d.expense > 0 ? fmt(d.expense) : '—'}
                    </td>
                    <td className={['px-4 py-2 text-right tabular-nums font-semibold', d.net >= 0 ? 'text-lz-success' : 'text-lz-danger'].join(' ')}>
                      {d.net >= 0 ? '' : '-'}{fmt(d.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
