import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSalesList, getSalesDashboardStats, PAGE_SIZE, type SaleRow } from '@/features/sales/data/sales'
import {
  ORDER_STATUS_LABELS,
  SALE_CHANNEL_LABELS,
  PAYMENT_METHOD_LABELS,
  MANUAL_SALE_CHANNEL_OPTIONS,
  MANUAL_SALE_PAYMENT_OPTIONS,
} from '@/features/orders/data/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Badge }      from '@/components/ui/badge'
import { Card }       from '@/components/ui/card'
import { StatCard }   from '@/components/ui/stat-card'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { IconCart, IconDollar, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Ventas' }

type Props = {
  searchParams: Promise<{
    status?: string; sale_channel?: string; payment_method?: string
    search?: string; date_from?: string; date_to?: string; page?: string
  }>
}

function fmt(v: number) {
  return `USD ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

async function SalesDashboard() {
  const s = await getSalesDashboardStats()
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
      <StatCard label="Hoy"           value={String(s.todayCount)}     icon={<IconCart size={18} />} />
      <StatCard label="Ingresos hoy"  value={fmt(s.todayRevenue)}      icon={<IconDollar size={18} />} />
      <StatCard label="Mes (ingresos)" value={fmt(s.monthRevenue)}     icon={<IconDollar size={18} />} />
      <StatCard label="Ticket prom."  value={fmt(s.avgTicket)}         icon={<IconDollar size={18} />} />
      <StatCard label="Pendientes"    value={String(s.pendingCount)}   icon={<IconCart size={18} />} />
      <StatCard label="Entregadas"    value={String(s.deliveredCount)} icon={<IconCart size={18} />} />
      <StatCard label="Canceladas"    value={String(s.cancelledCount)} icon={<IconCart size={18} />} />
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key: 'order_number', header: 'Nro. Venta',
    render: (r: SaleRow) => (
      <Link href={`/admin/sales/${r.id}`} className="font-mono text-sm font-medium text-lz-accent hover:underline">
        {r.order_number}
      </Link>
    ),
  },
  {
    key: 'created_at', header: 'Fecha', className: 'hidden md:table-cell',
    render: (r: SaleRow) => (
      <span className="text-xs text-lz-muted">
        {new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  {
    key: 'customer', header: 'Cliente',
    render: (r: SaleRow) => {
      const name = r.customers
        ? `${r.customers.first_name} ${r.customers.last_name ?? ''}`.trim()
        : '—'
      return (
        <div>
          <p className="text-sm text-lz-text">{name}</p>
          {r.customers?.phone && <p className="text-xs text-lz-muted">{r.customers.phone}</p>}
        </div>
      )
    },
  },
  {
    key: 'sale_channel', header: 'Canal', className: 'hidden sm:table-cell',
    render: (r: SaleRow) => (
      <span className="text-xs text-lz-muted">
        {SALE_CHANNEL_LABELS[r.sale_channel] ?? r.sale_channel}
      </span>
    ),
  },
  {
    key: 'payment_method', header: 'Pago', className: 'hidden lg:table-cell',
    render: (r: SaleRow) => (
      <span className="text-xs text-lz-muted">
        {r.payment_method ? (PAYMENT_METHOD_LABELS[r.payment_method] ?? r.payment_method) : '—'}
      </span>
    ),
  },
  {
    key: 'status', header: 'Estado',
    render: (r: SaleRow) => {
      const s = ORDER_STATUS_LABELS[r.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? r.status}</Badge>
    },
  },
  {
    key: 'total_amount', header: 'Total', className: 'text-right',
    render: (r: SaleRow) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">
        {r.currency_code} {r.total_amount.toFixed(2)}
      </span>
    ),
  },
]

// ─── Pagination ───────────────────────────────────────────────────────────────

function buildUrl(sp: Record<string, string | undefined>, page: number) {
  const p = new URLSearchParams()
  Object.entries(sp).forEach(([k, v]) => { if (v && k !== 'page') p.set(k, v) })
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `/admin/sales${qs ? '?' + qs : ''}`
}

function Pagination({
  page, totalPages, count, sp,
}: {
  page: number; totalPages: number; count: number; sp: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to   = Math.min(page * PAGE_SIZE, count)

  return (
    <div className="flex items-center justify-between border-t border-lz-border px-4 py-3 text-sm">
      <p className="text-xs text-lz-muted">{from}–{to} de {count} ventas</p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={buildUrl(sp, page - 1)}
            className="rounded-lg border border-lz-border px-3 py-1.5 text-xs text-lz-muted hover:border-lz-primary/40 hover:text-lz-text">
            Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link href={buildUrl(sp, page + 1)}
            className="rounded-lg border border-lz-border px-3 py-1.5 text-xs text-lz-muted hover:border-lz-primary/40 hover:text-lz-text">
            Siguiente
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Status filter options ────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',           label: 'Todos los estados' },
  { value: 'draft',      label: 'Borrador' },
  { value: 'pending',    label: 'Pendiente' },
  { value: 'confirmed',  label: 'Confirmada' },
  { value: 'preparing',  label: 'En preparación' },
  { value: 'shipped',    label: 'Enviada' },
  { value: 'delivered',  label: 'Entregada' },
  { value: 'cancelled',  label: 'Cancelada' },
  { value: 'refunded',   label: 'Reembolsada' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SalesPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('orders.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('sales.manual')

  const sp = await searchParams
  const filters = {
    status:         sp.status,
    sale_channel:   sp.sale_channel,
    payment_method: sp.payment_method,
    search:         sp.search,
    date_from:      sp.date_from,
    date_to:        sp.date_to,
    page:           sp.page ? parseInt(sp.page) : 1,
  }

  const { rows, count, page, totalPages } = await getSalesList(filters)

  const hasFilters = !!(sp.status || sp.sale_channel || sp.payment_method || sp.search || sp.date_from || sp.date_to)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Ventas"
        description="Centro de gestión de todas las ventas del negocio."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Ventas' }]}
        actions={canCreate ? (
          <Link
            href="/admin/sales/manual"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nueva venta manual
          </Link>
        ) : undefined}
      />

      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}
        </div>
      }>
        <SalesDashboard />
      </Suspense>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <input
          type="search"
          name="search"
          placeholder="Buscar nro., cliente, teléfono…"
          defaultValue={sp.search ?? ''}
          className="h-9 w-full rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text placeholder:text-lz-muted/60 focus:outline-none focus:ring-2 focus:ring-lz-primary/50 sm:w-56"
        />
        <select name="status" defaultValue={sp.status ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select name="sale_channel" defaultValue={sp.sale_channel ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50">
          <option value="">Todos los canales</option>
          {MANUAL_SALE_CHANNEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select name="payment_method" defaultValue={sp.payment_method ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50">
          <option value="">Todos los métodos</option>
          {MANUAL_SALE_PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" name="date_from" defaultValue={sp.date_from ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50" />
        <input type="date" name="date_to" defaultValue={sp.date_to ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50" />
        <button type="submit"
          className="h-9 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
          Filtrar
        </button>
        {hasFilters && (
          <Link href="/admin/sales"
            className="h-9 inline-flex items-center px-3 text-xs text-lz-muted hover:text-lz-text">
            Limpiar
          </Link>
        )}
      </form>

      <p className="text-xs text-lz-muted">{count} venta{count !== 1 ? 's' : ''} encontrada{count !== 1 ? 's' : ''}</p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<IconCart size={22} className="text-lz-muted" />}
          title="Sin ventas"
          description="No hay ventas que coincidan con los filtros aplicados."
          action={canCreate ? (
            <Link href="/admin/sales/manual"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nueva venta manual
            </Link>
          ) : undefined}
        />
      ) : (
        <Card padding={false}>
          <Table columns={COLUMNS} rows={rows} keyExtractor={(r) => r.id} />
          <Pagination page={page} totalPages={totalPages} count={count} sp={sp} />
        </Card>
      )}
    </div>
  )
}
