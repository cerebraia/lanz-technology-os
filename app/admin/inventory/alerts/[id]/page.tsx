import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getAlertByProductId,
  getAlertRecommendation,
  type AlertStatus,
} from '@/features/inventory/data/alerts'
import { MOVEMENT_TYPE_LABELS, type InventoryMovementRow } from '@/features/inventory/data/inventory'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconBox }     from '@/components/icons'

export const metadata: Metadata = { title: 'Alerta de reposición' }

// ─── Alert badge ──────────────────────────────────────────────────────────────

function AlertBadge({ status }: { status: AlertStatus }) {
  if (status === 'out_of_stock') return <Badge variant="danger">Agotado</Badge>
  if (status === 'critical')     return <Badge variant="warning">Crítico</Badge>
  if (status === 'low_stock')    return <Badge variant="warning">Stock bajo</Badge>
  return <Badge variant="success">En stock</Badge>
}

function alertVariant(status: AlertStatus): 'danger' | 'warning' | 'info' {
  if (status === 'out_of_stock') return 'danger'
  if (status === 'critical')     return 'warning'
  if (status === 'low_stock')    return 'warning'
  return 'info'
}

// ─── Movement columns ─────────────────────────────────────────────────────────

const MOVEMENT_COLUMNS = [
  {
    key:       'created_at',
    header:    'Fecha',
    className: 'w-36',
    render:    (row: InventoryMovementRow) => (
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
    key:    'movement_type',
    header: 'Tipo',
    render: (row: InventoryMovementRow) => (
      <span className="text-sm text-lz-text">
        {MOVEMENT_TYPE_LABELS[row.movement_type] ?? row.movement_type}
      </span>
    ),
  },
  {
    key:       'quantity',
    header:    'Cantidad',
    className: 'text-right w-24',
    render:    (row: InventoryMovementRow) => (
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
    key:       'quantity_after',
    header:    'Saldo tras',
    className: 'hidden sm:table-cell text-right w-28',
    render:    (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_after}</span>
    ),
  },
  {
    key:       'reason',
    header:    'Motivo',
    className: 'hidden md:table-cell',
    render:    (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">{row.reason ?? '—'}</span>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export default async function AlertDetailPage({ params }: Props) {
  await verifySession()
  const canRead = await checkPermission('inventory.alerts.read')
  if (!canRead) redirect('/admin')

  const { id }  = await params
  const detail  = await getAlertByProductId(id)
  if (!detail) notFound()

  const recommendation = getAlertRecommendation(detail)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={detail.product_name}
        description={`SKU: ${detail.sku}`}
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Alertas',    href: '/admin/inventory/alerts' },
          { label: detail.product_name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/inventory/${detail.product_id}`}
              className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
            >
              Ver inventario
            </Link>
            <Link
              href={`/admin/catalog/products/${detail.product_id}`}
              className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
            >
              Ver producto
            </Link>
          </div>
        }
      />

      {/* Recomendación */}
      <Alert variant={alertVariant(detail.status)} title="Recomendación">
        {recommendation}
      </Alert>

      {/* Ficha de stock */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-lz-text">Estado de inventario</p>
              <p className="mt-0.5 text-xs text-lz-muted">
                {detail.category_name ?? 'Sin categoría'}
              </p>
            </div>
            <AlertBadge status={detail.status} />
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Disponible',         value: detail.available },
              { label: 'Total físico',        value: detail.on_hand },
              { label: 'Reservado',           value: detail.reserved },
              { label: 'Stock mínimo',        value: detail.min_stock },
              { label: 'Punto de reposición', value: detail.reorder_point },
              { label: 'Cant. sugerida',      value: detail.reorder_quantity > 0 ? detail.reorder_quantity : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-semibold tabular-nums text-lz-text">{value}</p>
                <p className="mt-0.5 text-[11px] text-lz-muted">{label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Sugerencia de compra */}
      {detail.reorder_quantity > 0 && (
        <Card className="border-lz-primary/30 bg-lz-primary/5">
          <CardBody>
            <p className="text-sm font-medium text-lz-accent">Sugerencia de compra</p>
            <p className="mt-1 text-xs text-lz-muted">
              Se recomienda adquirir{' '}
              <span className="font-semibold text-lz-text">{detail.reorder_quantity} unidades</span>{' '}
              de <span className="font-medium text-lz-text">{detail.product_name}</span> para
              restablecer el nivel de stock recomendado.
            </p>
            <p className="mt-2 text-[11px] text-lz-muted">
              Las órdenes de compra estarán disponibles en una próxima fase.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Movimientos recientes */}
      <Card padding={false}>
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-lz-text">Movimientos recientes</p>
            <p className="mt-0.5 text-xs text-lz-muted">Últimos 10 movimientos de inventario</p>
          </div>
        </CardHeader>
        {detail.movements.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<IconBox size={20} className="text-lz-muted" />}
              title="Sin movimientos"
              description="Este producto no tiene movimientos de inventario registrados."
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={MOVEMENT_COLUMNS}
              rows={detail.movements}
              keyExtractor={(row) => row.id}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
