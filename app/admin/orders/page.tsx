import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getOrders, getDashboardStats, type OrderWithRelations } from '@/features/orders/data/orders'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, SALE_CHANNEL_LABELS } from '@/features/orders/data/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Badge }      from '@/components/ui/badge'
import { Table }      from '@/components/ui/table'
import { StatCard }   from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Card }       from '@/components/ui/card'
import { IconCart, IconPlus, IconDollar } from '@/components/icons'

export const metadata: Metadata = { title: 'Pedidos' }

type Props = { searchParams: Promise<{ status?: string; search?: string }> }

function fmt(v: number) {
  return `USD ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function DashboardStats() {
  const s = await getDashboardStats()
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Pedidos hoy"      value={String(s.todayCount)}    icon={<IconCart   size={18} />} />
      <StatCard label="Ventas del mes"   value={fmt(s.monthRevenue)}     icon={<IconDollar size={18} />} />
      <StatCard label="Ticket promedio"  value={fmt(s.avgTicket)}        icon={<IconDollar size={18} />} />
      <StatCard label="Pendientes"       value={String(s.pendingCount)}  icon={<IconCart   size={18} />} />
      <StatCard label="Enviados"         value={String(s.shippedCount)}  icon={<IconCart   size={18} />} />
      <StatCard label="Cancelados"       value={String(s.cancelledCount)} icon={<IconCart  size={18} />} />
    </div>
  )
}

const COLUMNS = [
  {
    key: 'order_number', header: 'Pedido',
    render: (row: OrderWithRelations) => (
      <Link href={`/admin/orders/${row.id}`} className="font-mono text-sm font-medium text-lz-accent hover:underline">
        {row.order_number}
      </Link>
    ),
  },
  {
    key: 'customer', header: 'Cliente',
    render: (row: OrderWithRelations) => {
      const name = row.customers
        ? `${row.customers.first_name} ${row.customers.last_name ?? ''}`.trim()
        : '—'
      return (
        <div>
          <p className="text-sm text-lz-text">{name}</p>
          <p className="text-xs text-lz-muted">{SALE_CHANNEL_LABELS[row.sale_channel] ?? row.sale_channel}</p>
        </div>
      )
    },
  },
  {
    key: 'status', header: 'Estado',
    render: (row: OrderWithRelations) => {
      const s = ORDER_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key: 'payment_status', header: 'Pago', className: 'hidden sm:table-cell',
    render: (row: OrderWithRelations) => {
      const p = PAYMENT_STATUS_LABELS[row.payment_status]
      return <Badge variant={p?.variant ?? 'neutral'}>{p?.label ?? row.payment_status}</Badge>
    },
  },
  {
    key: 'total_amount', header: 'Total', className: 'text-right',
    render: (row: OrderWithRelations) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">
        {row.currency_code} {row.total_amount.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'created_at', header: 'Fecha', className: 'hidden md:table-cell',
    render: (row: OrderWithRelations) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
]

export default async function OrdersPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('orders.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('orders.create')

  const sp     = await searchParams
  const orders = await getOrders({ status: sp.status, search: sp.search })

  const statusFilters = [
    { value: '',           label: 'Todos' },
    { value: 'draft',      label: 'Borradores' },
    { value: 'pending',    label: 'Pendientes' },
    { value: 'processing', label: 'En proceso' },
    { value: 'shipped',    label: 'Enviados' },
    { value: 'delivered',  label: 'Entregados' },
    { value: 'cancelled',  label: 'Cancelados' },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Pedidos"
        description="Centro de gestión de ventas."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Pedidos' }]}
        actions={canCreate ? (
          <Link
            href="/admin/orders/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nuevo pedido
          </Link>
        ) : undefined}
      />

      <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}</div>}>
        <DashboardStats />
      </Suspense>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <input
          type="search"
          name="search"
          placeholder="Buscar nro. pedido o cliente…"
          defaultValue={sp.search ?? ''}
          className="h-9 w-full rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text placeholder:text-lz-muted/60 focus:outline-none focus:ring-2 focus:ring-lz-primary/50 sm:w-64"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
        >
          {statusFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button type="submit" className="h-9 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
          Buscar
        </button>
        {(sp.search || sp.status) && (
          <Link href="/admin/orders" className="h-9 inline-flex items-center px-3 text-xs text-lz-muted hover:text-lz-text">Limpiar</Link>
        )}
      </form>

      {orders.length === 0 ? (
        <EmptyState
          icon={<IconCart size={22} className="text-lz-muted" />}
          title="Sin pedidos"
          description="Crea tu primer pedido de venta para empezar."
          action={canCreate ? (
            <Link href="/admin/orders/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nuevo pedido
            </Link>
          ) : undefined}
        />
      ) : (
        <Card padding={false}>
          <Table columns={COLUMNS} rows={orders} keyExtractor={(r) => r.id} />
        </Card>
      )}
    </div>
  )
}
