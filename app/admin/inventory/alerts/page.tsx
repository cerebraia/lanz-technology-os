import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getAlerts,
  getAlertStats,
  type AlertEntry,
  type AlertFilters,
  type AlertStatus,
} from '@/features/inventory/data/alerts'
import { getCategories } from '@/features/catalog/data/categories'
import { AlertFilters as AlertFiltersComponent } from '@/features/inventory/components/alert-filters'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card }        from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { Skeleton }    from '@/components/ui/skeleton'
import { IconBox }     from '@/components/icons'

export const metadata: Metadata = { title: 'Alertas de inventario' }

// ─── Alert badge ──────────────────────────────────────────────────────────────

function AlertBadge({ status }: { status: AlertStatus }) {
  if (status === 'out_of_stock') return <Badge variant="danger">Agotado</Badge>
  if (status === 'critical')     return <Badge variant="warning">Crítico</Badge>
  if (status === 'low_stock')    return <Badge variant="warning">Stock bajo</Badge>
  return <Badge variant="success">En stock</Badge>
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

async function StatsPanel() {
  const stats = await getAlertStats()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        {
          label:   'Agotados',
          value:   stats.outOfStock,
          color:   'text-lz-danger',
        },
        {
          label:   'Críticos',
          value:   stats.critical,
          color:   'text-lz-warning',
        },
        {
          label:   'Stock bajo',
          value:   stats.lowStock,
          color:   'text-lz-warning',
        },
        {
          label:   'Unidades por reponer',
          value:   stats.unitsToReorder,
          color:   'text-lz-text',
        },
      ].map(({ label, value, color }) => (
        <Card key={label} className="text-center">
          <p className={['text-2xl font-semibold tracking-tight', color].join(' ')}>
            {value}
          </p>
          <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key:    'product',
    header: 'Producto',
    render: (row: AlertEntry) => (
      <div>
        <Link
          href={`/admin/inventory/alerts/${row.product_id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.product_name}
        </Link>
        <p className="mt-0.5 font-mono text-xs text-lz-muted">{row.sku}</p>
      </div>
    ),
  },
  {
    key:       'category',
    header:    'Categoría',
    className: 'hidden md:table-cell',
    render:    (row: AlertEntry) => (
      <span className="text-xs text-lz-muted">{row.category_name ?? '—'}</span>
    ),
  },
  {
    key:    'available',
    header: 'Disponible',
    render: (row: AlertEntry) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">{row.available}</span>
    ),
  },
  {
    key:       'min_stock',
    header:    'Mínimo',
    className: 'hidden sm:table-cell',
    render:    (row: AlertEntry) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.min_stock}</span>
    ),
  },
  {
    key:       'reorder_point',
    header:    'Punto reposición',
    className: 'hidden lg:table-cell',
    render:    (row: AlertEntry) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.reorder_point}</span>
    ),
  },
  {
    key:       'reorder_quantity',
    header:    'Cant. sugerida',
    className: 'hidden lg:table-cell',
    render:    (row: AlertEntry) => (
      <span className="tabular-nums text-xs text-lz-muted">
        {row.reorder_quantity > 0 ? row.reorder_quantity : '—'}
      </span>
    ),
  },
  {
    key:    'status',
    header: 'Estado',
    render: (row: AlertEntry) => <AlertBadge status={row.status} />,
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: AlertEntry) => (
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/inventory/alerts/${row.product_id}`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
        >
          Ver alerta
        </Link>
        <Link
          href={`/admin/inventory/${row.product_id}`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
        >
          Inventario
        </Link>
      </div>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{
    search?:   string
    category?: string
    status?:   string
  }>
}

export default async function AlertsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('inventory.alerts.read')
  if (!canRead) redirect('/admin')

  const sp         = await searchParams
  const categories = await getCategories()
  const filters: AlertFilters = {
    search:     sp.search    || undefined,
    categoryId: sp.category  || undefined,
    status:     (sp.status as AlertStatus | '') || undefined,
  }
  const entries = await getAlerts(filters)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Alertas de inventario"
        description="Productos que requieren reposición ordenados por urgencia."
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Inventario',  href: '/admin/inventory' },
          { label: 'Alertas' },
        ]}
      />

      {/* Tarjetas superiores */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="space-y-2">
                <Skeleton className="mx-auto h-7 w-12" />
                <Skeleton className="mx-auto h-3 w-24" />
              </Card>
            ))}
          </div>
        }
      >
        <StatsPanel />
      </Suspense>

      {/* Filtros */}
      <AlertFiltersComponent categories={categories} />

      {/* Tabla */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Sin alertas activas"
          description="Todos los productos tienen stock saludable o no hay productos con movimientos registrados."
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={entries}
          keyExtractor={(row) => row.product_id}
        />
      )}
    </div>
  )
}
