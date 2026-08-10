import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getInventoryByProductId,
  getInventoryMovements,
  getStockStatus,
  MOVEMENT_TYPE_LABELS,
  type InventoryEntry,
  type InventoryMovementRow,
} from '@/features/inventory/data/inventory'
import { getProductById } from '@/features/catalog/data/products'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { IconBox } from '@/components/icons'

export const metadata: Metadata = { title: 'Detalle de inventario' }

// ─── Movement table columns ───────────────────────────────────────────────────

const MOVEMENT_COLUMNS = [
  {
    key: 'created_at',
    header: 'Fecha',
    className: 'w-36',
    render: (row: InventoryMovementRow) => (
      <span className="whitespace-nowrap text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
        {' '}
        {new Date(row.created_at).toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    ),
  },
  {
    key: 'movement_type',
    header: 'Tipo',
    render: (row: InventoryMovementRow) => (
      <span className="text-sm text-lz-text">
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
    key: 'quantity_before',
    header: 'Antes',
    className: 'hidden sm:table-cell text-right w-20',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_before}</span>
    ),
  },
  {
    key: 'quantity_after',
    header: 'Después',
    className: 'hidden sm:table-cell text-right w-20',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_after}</span>
    ),
  },
  {
    key: 'location',
    header: 'Ubicación',
    className: 'hidden md:table-cell',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">
        {row.inventory_locations
          ? `${row.inventory_locations.name} (${row.inventory_locations.code})`
          : '—'}
      </span>
    ),
  },
  {
    key: 'reason',
    header: 'Motivo',
    className: 'hidden lg:table-cell',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">{row.reason ?? '—'}</span>
    ),
  },
  {
    key: 'user',
    header: 'Usuario',
    className: 'hidden lg:table-cell',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">
        {row.profiles?.full_name ?? '—'}
      </span>
    ),
  },
]

// ─── Balance card ─────────────────────────────────────────────────────────────

function BalanceCard({ entry }: { entry: InventoryEntry }) {
  const status = getStockStatus(entry.available, entry.products.min_stock)

  const statusBadge =
    status === 'out' ? <Badge variant="danger">Sin stock</Badge> :
    status === 'low' ? <Badge variant="warning">Stock bajo</Badge> :
    <Badge variant="success">En stock</Badge>

  return (
    <Card padding={false}>
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-lz-text">
            {entry.inventory_locations.name}
            {' '}
            <span className="font-mono text-xs text-lz-muted">
              ({entry.inventory_locations.code})
            </span>
          </p>
          <p className="mt-0.5 text-xs text-lz-muted">
            Actualizado{' '}
            {new Date(entry.updated_at).toLocaleDateString('es-MX', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        {statusBadge}
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          {[
            { label: 'Disponible',    value: entry.available, highlight: true },
            { label: 'Total físico',  value: entry.on_hand },
            { label: 'Reservado',     value: entry.reserved },
            { label: 'Stock mínimo',  value: entry.products.min_stock },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="text-center">
              <p
                className={[
                  'text-2xl font-semibold tabular-nums',
                  highlight
                    ? status === 'out' ? 'text-lz-danger'
                      : status === 'low' ? 'text-lz-warning'
                      : 'text-lz-success'
                    : 'text-lz-text',
                ].join(' ')}
              >
                {value}
              </p>
              <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
            </div>
          ))}
        </div>

        {status !== 'ok' && (
          <div className="mt-4">
            {status === 'out' && (
              <Alert variant="danger">
                Sin stock disponible. Registra una entrada para reponer este producto.
              </Alert>
            )}
            {status === 'low' && (
              <Alert variant="warning">
                Stock por debajo del mínimo configurado ({entry.products.min_stock} unidades).
              </Alert>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export default async function InventoryDetailPage({ params }: Props) {
  const { id: productId } = await params

  await verifySession()
  const canRead = await checkPermission('inventory.read')
  if (!canRead) redirect('/admin')

  const [product, balances, movements] = await Promise.all([
    getProductById(productId),
    getInventoryByProductId(productId),
    getInventoryMovements(productId),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}${product.categories ? ` · ${product.categories.name}` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: product.name },
        ]}
        secondaryActions={
          <Link
            href={`/admin/catalog/products/${productId}`}
            className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
          >
            Ver en catálogo →
          </Link>
        }
      />

      {/* No hay registros de inventario todavía */}
      {balances.length === 0 ? (
        <Alert variant="info" title="Sin registro de inventario">
          Este producto no tiene movimientos de stock aún. Registra la primera entrada
          para inicializar su inventario.
        </Alert>
      ) : (
        <>
          {/* Saldo por ubicación */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {balances.map((entry) => (
              <BalanceCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Historial de movimientos */}
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">
                  Historial de movimientos
                </p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  Últimos {movements.length} movimientos — ledger inmutable
                </p>
              </div>
            </CardHeader>

            {movements.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={<IconBox size={20} className="text-lz-muted" />}
                  title="Sin movimientos registrados"
                  description="El historial aparecerá aquí una vez se registre el primer movimiento."
                />
              </CardBody>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={MOVEMENT_COLUMNS}
                  rows={movements}
                  keyExtractor={(row) => row.id}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
