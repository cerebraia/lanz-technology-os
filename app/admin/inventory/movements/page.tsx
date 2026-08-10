import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getMovementsFiltered,
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_TYPE_LABELS,
  type InventoryMovementRow,
} from '@/features/inventory/data/inventory'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { IconBox, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Movimientos de inventario' }

// ─── Filters (client component) ───────────────────────────────────────────────

import { MovementFiltersBar } from '@/features/inventory/components/movement-filters'

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key: 'created_at',
    header: 'Fecha',
    className: 'w-36',
    render: (row: InventoryMovementRow) => (
      <span className="whitespace-nowrap text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
    ),
  },
  {
    key: 'product',
    header: 'Producto',
    render: (row: InventoryMovementRow) => (
      <div>
        {row.products ? (
          <Link
            href={`/admin/inventory/${row.product_id}`}
            className="font-medium text-lz-text transition-colors hover:text-lz-accent"
          >
            {row.products.name}
          </Link>
        ) : (
          <span className="text-lz-muted">—</span>
        )}
        {row.products && (
          <p className="font-mono text-[10px] text-lz-muted">{row.products.sku}</p>
        )}
      </div>
    ),
  },
  {
    key: 'movement_type',
    header: 'Tipo',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-text">
        {MOVEMENT_TYPE_LABELS[row.movement_type] ?? row.movement_type}
      </span>
    ),
  },
  {
    key: 'quantity',
    header: 'Cantidad',
    className: 'text-right w-24',
    render: (row: InventoryMovementRow) => (
      <span
        className={[
          'tabular-nums text-sm font-semibold',
          row.quantity >= 0 ? 'text-lz-success' : 'text-lz-danger',
        ].join(' ')}
      >
        {row.quantity >= 0 ? '+' : ''}{row.quantity}
      </span>
    ),
  },
  {
    key: 'qty_before',
    header: 'Antes',
    className: 'hidden sm:table-cell text-right w-20',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_before}</span>
    ),
  },
  {
    key: 'qty_after',
    header: 'Después',
    className: 'hidden sm:table-cell text-right w-20',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_after}</span>
    ),
  },
  {
    key: 'reason',
    header: 'Motivo',
    className: 'hidden md:table-cell',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">{row.reason ?? '—'}</span>
    ),
  },
  {
    key: 'user',
    header: 'Usuario',
    className: 'hidden lg:table-cell',
    render: (row: InventoryMovementRow) => (
      <Badge variant="neutral">{row.profiles?.full_name ?? 'Sistema'}</Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (row: InventoryMovementRow) => (
      <Link
        href={`/admin/inventory/movements/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Ver
      </Link>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{
    search?:  string
    type?:    string
    from?:    string
    to?:      string
  }>
}

export default async function MovementsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('inventory.read')
  if (!canRead) redirect('/admin')

  const canCreate = await checkPermission('inventory.receive') ||
                    await checkPermission('inventory.adjust')   ||
                    await checkPermission('inventory.reserve')

  const sp = await searchParams
  const movements = await getMovementsFiltered({
    search:       sp.search || undefined,
    movementType: sp.type   || undefined,
    dateFrom:     sp.from   || undefined,
    dateTo:       sp.to     || undefined,
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Movimientos de inventario"
        description="Ledger inmutable — registro permanente de todos los cambios de stock"
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Movimientos' },
        ]}
        actions={
          canCreate ? (
            <Link href="/admin/inventory/movements/new">
              <Button size="sm">
                <IconPlus size={14} />
                Nuevo movimiento
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Filtros */}
      <Suspense fallback={<Skeleton className="h-9 w-full max-w-2xl" />}>
        <MovementFiltersBar typeOptions={MOVEMENT_TYPE_OPTIONS} />
      </Suspense>

      {/* Tabla */}
      {movements.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Sin movimientos registrados"
          description="Los movimientos aparecerán aquí cuando el inventario comience a operar."
          action={
            canCreate ? (
              <Link href="/admin/inventory/movements/new">
                <Button size="sm">
                  <IconPlus size={14} />
                  Registrar movimiento
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={movements}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
