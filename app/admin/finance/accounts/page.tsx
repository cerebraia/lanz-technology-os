import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getAccounts, type FinancialAccount } from '@/features/finance/data/accounts'
import { ACCOUNT_TYPE_LABELS } from '@/features/finance/data/constants'
import { toggleAccountAction } from '@/features/finance/actions/finance-actions'
import { PageHeader } from '@/components/ui/page-header'
import { Badge }      from '@/components/ui/badge'
import { Card }       from '@/components/ui/card'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { IconDollar, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Cuentas financieras' }

async function ToggleForm({ id, active }: { id: string; active: boolean }) {
  async function action() {
    'use server'
    await toggleAccountAction(id, !active)
  }
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        {active ? 'Desactivar' : 'Activar'}
      </button>
    </form>
  )
}

const COLUMNS = [
  {
    key: 'name', header: 'Cuenta',
    render: (row: FinancialAccount) => (
      <div>
        <Link href={`/admin/finance/accounts/${row.id}`} className="font-medium text-lz-text transition-colors hover:text-lz-accent">{row.name}</Link>
        <p className="text-xs text-lz-muted">{ACCOUNT_TYPE_LABELS[row.type] ?? row.type}</p>
      </div>
    ),
  },
  {
    key: 'balance', header: 'Saldo',
    render: (row: FinancialAccount) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">
        {row.currency} {row.balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: 'currency', header: 'Moneda', className: 'hidden sm:table-cell',
    render: (row: FinancialAccount) => <span className="text-xs text-lz-muted">{row.currency}</span>,
  },
  {
    key: 'status', header: 'Estado',
    render: (row: FinancialAccount) =>
      row.is_active ? <Badge variant="success">Activa</Badge> : <Badge variant="neutral">Inactiva</Badge>,
  },
  {
    key: 'actions', header: '', className: 'text-right',
    render: (row: FinancialAccount) => <ToggleForm id={row.id} active={row.is_active} />,
  },
]

export default async function AccountsPage() {
  await verifySession()
  const canRead   = await checkPermission('finance.accounts.read')
  if (!canRead) redirect('/admin/finance')
  const canManage = await checkPermission('finance.accounts.manage')
  const accounts  = await getAccounts()
  const totalCash = accounts.filter((a) => a.is_active).reduce((acc, a) => acc + a.balance, 0)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Cuentas financieras"
        description="Efectivo, bancos y cuentas digitales de Lanz Technology."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Cuentas' }]}
        actions={canManage ? (
          <Link href="/admin/finance/accounts/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
            <IconPlus size={14} /> Nueva cuenta
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xl font-semibold text-lz-text">
            USD {totalCash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-xs text-lz-muted">Saldo total activo</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-semibold text-lz-success">{accounts.filter((a) => a.is_active).length}</p>
          <p className="mt-0.5 text-xs text-lz-muted">Cuentas activas</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-semibold text-lz-muted">{accounts.filter((a) => !a.is_active).length}</p>
          <p className="mt-0.5 text-xs text-lz-muted">Cuentas inactivas</p>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<IconDollar size={22} className="text-lz-muted" />}
          title="Sin cuentas registradas"
          description="Agrega las cuentas de efectivo, banco y cuentas digitales para llevar el control de saldos."
          action={canManage ? (
            <Link href="/admin/finance/accounts/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nueva cuenta
            </Link>
          ) : undefined}
        />
      ) : (
        <Table columns={COLUMNS} rows={accounts} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
