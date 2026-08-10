import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getPayables, type AccountPayable } from '@/features/finance/data/payables'
import { PAYABLE_STATUS_LABELS } from '@/features/finance/data/constants'
import { StatusActionButtons } from '@/features/finance/components/status-action-buttons'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconDollar, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Cuentas por pagar' }

type Props = { searchParams: Promise<{ status?: string }> }

const COLUMNS = (canManage: boolean) => [
  {
    key: 'description', header: 'Descripción',
    render: (row: AccountPayable) => (
      <div>
        <p className="text-sm font-medium text-lz-text">{row.description}</p>
        {row.suppliers && <p className="text-xs text-lz-muted">{row.suppliers.name}</p>}
      </div>
    ),
  },
  {
    key: 'amount', header: 'Monto', className: 'text-right',
    render: (row: AccountPayable) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">
        {row.currency} {row.amount.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'due_date', header: 'Vencimiento', className: 'hidden sm:table-cell',
    render: (row: AccountPayable) => (
      <span className="text-xs text-lz-muted">
        {row.due_date ? new Date(row.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
      </span>
    ),
  },
  {
    key: 'status', header: 'Estado',
    render: (row: AccountPayable) => {
      const s = PAYABLE_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key: 'actions', header: '', className: 'text-right',
    render: (row: AccountPayable) => (
      <StatusActionButtons id={row.id} mode="payable" currentStatus={row.status} canManage={canManage} />
    ),
  },
]

export default async function PayablesPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('finance.payables.read')
  if (!canRead) redirect('/admin/finance')
  const canManage = await checkPermission('finance.payables.manage')
  const sp        = await searchParams
  const payables  = await getPayables({ status: sp.status })

  const pending = payables.filter((p) => p.status === 'pending').reduce((a, p) => a + p.amount, 0)
  const overdue = payables.filter((p) => p.status === 'overdue').reduce((a, p) => a + p.amount, 0)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Cuentas por pagar"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Finanzas', href: '/admin/finance' }, { label: 'Por pagar' }]}
        actions={canManage ? (
          <Link href="/admin/finance/payables/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
            <IconPlus size={14} /> Nueva deuda
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-lz-border bg-lz-surface p-4 text-center">
          <p className="text-xl font-semibold tabular-nums text-lz-warning">USD {overdue.toFixed(2)}</p>
          <p className="mt-0.5 text-xs text-lz-muted">Vencido</p>
        </div>
        <div className="rounded-xl border border-lz-border bg-lz-surface p-4 text-center">
          <p className="text-xl font-semibold tabular-nums text-lz-text">USD {pending.toFixed(2)}</p>
          <p className="mt-0.5 text-xs text-lz-muted">Pendiente</p>
        </div>
      </div>

      {payables.length === 0 ? (
        <EmptyState icon={<IconDollar size={22} className="text-lz-muted" />} title="Sin cuentas por pagar" description="Las deudas a proveedores aparecerán aquí." />
      ) : (
        <Table columns={COLUMNS(canManage)} rows={payables} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
