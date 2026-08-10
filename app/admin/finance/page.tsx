import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getTransactionSummary, getMonthlyTrend } from '@/features/finance/data/transactions'
import { getAccountStats } from '@/features/finance/data/accounts'
import { getPayableStats }  from '@/features/finance/data/payables'
import { getReceivableStats } from '@/features/finance/data/receivables'
import { BarChart } from '@/components/ui/bar-chart'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard }    from '@/components/ui/stat-card'
import { IconDollar, IconCart, IconUsers, IconBar } from '@/components/icons'

export const metadata: Metadata = { title: 'Finanzas' }

function fmtUSD(v: number) {
  return `USD ${Math.abs(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function FinanceDashboard() {
  const [summary, accounts, payables, receivables, trend] = await Promise.all([
    getTransactionSummary('month'),
    getAccountStats(),
    getPayableStats(),
    getReceivableStats(),
    getMonthlyTrend(6),
  ])

  const incomeData = trend.map((t) => ({ label: t.month, value: t.income, color: 'success' as const }))
  const expenseData = trend.map((t) => ({ label: t.month, value: t.expense, color: 'danger' as const }))

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Caja disponible"
          value={fmtUSD(accounts.totalCash)}
          helperText={`${accounts.active} cuentas activas`}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Ingresos del mes"
          value={fmtUSD(summary.income)}
          helperText="Movimientos tipo ingreso"
          icon={<IconCart size={18} />}
        />
        <StatCard
          label="Egresos del mes"
          value={fmtUSD(summary.expense)}
          helperText="Movimientos tipo egreso"
          icon={<IconBar size={18} />}
        />
        <StatCard
          label="Beneficio neto"
          value={fmtUSD(summary.net)}
          helperText={summary.net >= 0 ? 'Positivo' : 'Negativo'}
          icon={<IconDollar size={18} />}
        />
        <StatCard
          label="Cuentas por pagar"
          value={fmtUSD(payables.totalOpen)}
          helperText={`${payables.count} obligaciones pendientes`}
          icon={<IconUsers size={18} />}
        />
        <StatCard
          label="Cuentas por cobrar"
          value={fmtUSD(receivables.totalOpen)}
          helperText={`${receivables.count} cobros pendientes`}
          icon={<IconUsers size={18} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Ingresos — últimos 6 meses</p>
              <p className="mt-0.5 text-xs text-lz-muted">Movimientos tipo ingreso</p>
            </div>
          </CardHeader>
          <CardBody>
            {incomeData.every((d) => d.value === 0) ? (
              <p className="text-sm text-lz-muted">Sin movimientos de ingreso registrados.</p>
            ) : (
              <BarChart data={incomeData} formatValue={fmtUSD} />
            )}
          </CardBody>
        </Card>

        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Egresos — últimos 6 meses</p>
              <p className="mt-0.5 text-xs text-lz-muted">Movimientos tipo egreso</p>
            </div>
          </CardHeader>
          <CardBody>
            {expenseData.every((d) => d.value === 0) ? (
              <p className="text-sm text-lz-muted">Sin movimientos de egreso registrados.</p>
            ) : (
              <BarChart data={expenseData} formatValue={fmtUSD} />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Cuentas',         href: '/admin/finance/accounts'      },
          { label: 'Transacciones',   href: '/admin/finance/transactions'  },
          { label: 'Por pagar',       href: '/admin/finance/payables'      },
          { label: 'Por cobrar',      href: '/admin/finance/receivables'   },
          { label: 'Flujo de caja',   href: '/admin/finance/cash-flow'     },
          { label: 'Rentabilidad',    href: '/admin/finance/profitability' },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm font-medium text-lz-text transition-colors hover:border-lz-primary/40 hover:text-lz-accent"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function FinancePage() {
  await verifySession()
  const canRead = await checkPermission('finance.read')
  if (!canRead) redirect('/admin')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Centro financiero"
        description="Movimientos, cuentas, obligaciones y rentabilidad de Lanz Technology."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Finanzas' },
        ]}
      />
      <Suspense fallback={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}
        </div>
      }>
        <FinanceDashboard />
      </Suspense>
    </div>
  )
}
