import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getTransactions, type FinancialTransaction } from '@/features/finance/data/transactions'
import { TX_TYPE_LABELS, TX_INCOME_CATEGORIES, TX_EXPENSE_CATEGORIES, TX_OTHER_CATEGORIES } from '@/features/finance/data/constants'
import { TransactionFilters } from '@/features/finance/components/transaction-filters'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconDollar, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Transacciones' }

const ALL_CATS: Record<string, string> = { ...TX_INCOME_CATEGORIES, ...TX_EXPENSE_CATEGORIES, ...TX_OTHER_CATEGORIES }

type Props = { searchParams: Promise<{ search?: string; type?: string; period?: string }> }

const COLUMNS = [
  {
    key: 'date', header: 'Fecha', className: 'w-28 hidden sm:table-cell',
    render: (row: FinancialTransaction) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.transaction_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  {
    key: 'type', header: 'Tipo',
    render: (row: FinancialTransaction) => {
      const t = TX_TYPE_LABELS[row.type]
      return <Badge variant={t?.variant ?? 'neutral'}>{t?.label ?? row.type}</Badge>
    },
  },
  {
    key: 'description', header: 'Descripción',
    render: (row: FinancialTransaction) => (
      <div>
        <p className="text-sm text-lz-text">{row.description}</p>
        <p className="text-xs text-lz-muted">{ALL_CATS[row.category] ?? row.category}</p>
      </div>
    ),
  },
  {
    key: 'amount', header: 'Monto', className: 'text-right',
    render: (row: FinancialTransaction) => (
      <span className={['tabular-nums text-sm font-semibold', row.type === 'income' ? 'text-lz-success' : row.type === 'expense' ? 'text-lz-danger' : 'text-lz-text'].join(' ')}>
        {row.type === 'income' ? '+' : row.type === 'expense' ? '-' : ''}{row.currency} {row.amount.toFixed(2)}
      </span>
    ),
  },
]

export default async function TransactionsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('finance.read')
  if (!canRead) redirect('/admin/finance')
  const canCreate = await checkPermission('finance.create')

  const sp = await searchParams
  const txs = await getTransactions({ search: sp.search, type: sp.type, period: sp.period ?? 'month' })

  const income  = txs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense = txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Transacciones"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Transacciones' }]}
        actions={canCreate ? (
          <Link href="/admin/finance/transactions/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
            <IconPlus size={14} /> Nuevo movimiento
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: `USD ${income.toFixed(2)}`, color: 'text-lz-success' },
          { label: 'Egresos',  value: `USD ${expense.toFixed(2)}`, color: 'text-lz-danger'  },
          { label: 'Neto',     value: `USD ${(income - expense).toFixed(2)}`, color: income - expense >= 0 ? 'text-lz-success' : 'text-lz-danger' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-lz-border bg-lz-surface p-4 text-center">
            <p className={['text-lg font-semibold tabular-nums', color].join(' ')}>{value}</p>
            <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
          </div>
        ))}
      </div>

      <TransactionFilters />

      {txs.length === 0 ? (
        <EmptyState icon={<IconDollar size={22} className="text-lz-muted" />} title="Sin transacciones" description="No hay movimientos financieros en el período seleccionado." />
      ) : (
        <Table columns={COLUMNS} rows={txs} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
