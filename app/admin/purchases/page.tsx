import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getPurchaseOrders,
  getPurchaseStats,
  PURCHASE_STATUS_LABELS,
  type PurchaseOrder,
} from '@/features/purchases/data/purchases'
import { PurchaseFilters } from '@/features/purchases/components/purchase-filters'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card }        from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { Skeleton }    from '@/components/ui/skeleton'
import { IconClipboard, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Órdenes de compra' }

// ─── Stats ────────────────────────────────────────────────────────────────────

async function StatsPanel() {
  const stats = await getPurchaseStats()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Borradores',    value: stats.draft,       color: 'text-lz-muted'  },
        { label: 'Enviadas',      value: stats.sent,        color: 'text-lz-info'   },
        { label: 'Completadas',   value: stats.completed,   color: 'text-lz-success'},
        {
          label: 'Monto total',
          value: `USD ${stats.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          color: 'text-lz-text',
        },
      ].map(({ label, value, color }) => (
        <Card key={label} className="text-center">
          <p className={['text-xl font-semibold tracking-tight', color].join(' ')}>{value}</p>
          <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key:    'reference',
    header: 'Referencia',
    render: (row: PurchaseOrder) => (
      <div>
        <Link
          href={`/admin/purchases/${row.id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.reference}
        </Link>
        {row.supplier_name && (
          <p className="mt-0.5 text-xs text-lz-muted">{row.supplier_name}</p>
        )}
      </div>
    ),
  },
  {
    key:    'status',
    header: 'Estado',
    render: (row: PurchaseOrder) => {
      const s = PURCHASE_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key:       'currency',
    header:    'Moneda',
    className: 'hidden sm:table-cell',
    render:    (row: PurchaseOrder) => (
      <span className="text-xs text-lz-muted">{row.currency}</span>
    ),
  },
  {
    key:       'items',
    header:    'Productos',
    className: 'hidden md:table-cell text-right',
    render:    (row: PurchaseOrder) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.items.length}</span>
    ),
  },
  {
    key:       'subtotal',
    header:    'Subtotal',
    className: 'text-right',
    render:    (row: PurchaseOrder) => (
      <span className="tabular-nums text-sm font-medium text-lz-text">
        {row.subtotal.toFixed(2)}
      </span>
    ),
  },
  {
    key:       'created_at',
    header:    'Fecha',
    className: 'hidden lg:table-cell',
    render:    (row: PurchaseOrder) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
    ),
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: PurchaseOrder) => (
      <Link
        href={`/admin/purchases/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Ver detalle
      </Link>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function PurchasesPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('purchases.read')
  if (!canRead) redirect('/admin')

  const canCreate = await checkPermission('purchases.create')
  const sp        = await searchParams
  const orders    = await getPurchaseOrders({
    search: sp.search  || undefined,
    status: sp.status  || undefined,
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Órdenes de compra"
        description="Gestión de compras a proveedores. El inventario se actualiza al confirmar la recepción de mercancía."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Compras' },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/admin/purchases/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              <IconPlus size={14} />
              Nueva orden
            </Link>
          ) : undefined
        }
      />

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="space-y-2">
                <Skeleton className="mx-auto h-6 w-20" />
                <Skeleton className="mx-auto h-3 w-24" />
              </Card>
            ))}
          </div>
        }
      >
        <StatsPanel />
      </Suspense>

      {/* Filtros */}
      <PurchaseFilters />

      {/* Tabla */}
      {orders.length === 0 ? (
        <EmptyState
          icon={<IconClipboard size={22} className="text-lz-muted" />}
          title="Sin órdenes de compra"
          description="Las órdenes de compra registradas aparecerán aquí."
          action={
            canCreate ? (
              <Link
                href="/admin/purchases/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
              >
                <IconPlus size={14} />
                Nueva orden
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={orders}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
