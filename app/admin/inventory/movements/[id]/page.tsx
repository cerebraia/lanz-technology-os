import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getMovementById, MOVEMENT_TYPE_LABELS } from '@/features/inventory/data/inventory'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

export const metadata: Metadata = { title: 'Detalle de movimiento' }

function MovementBadge({ type }: { type: string }) {
  const isIn =
    type === 'adjustment_in'   ||
    type === 'opening_balance' ||
    type === 'purchase_receipt'||
    type === 'import_receipt'  ||
    type === 'return_in'       ||
    type === 'transfer_in'     ||
    type === 'release'

  const isOut =
    type === 'adjustment_out'  ||
    type === 'sale'            ||
    type === 'return_out'      ||
    type === 'transfer_out'    ||
    type === 'damage'          ||
    type === 'loss'

  const variant =
    isIn  ? 'success' :
    isOut ? 'danger'  :
    type === 'reservation' ? 'warning' :
    'neutral'

  return (
    <Badge variant={variant}>
      {MOVEMENT_TYPE_LABELS[type] ?? type}
    </Badge>
  )
}

type Props = { params: Promise<{ id: string }> }

export default async function MovementDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canRead = await checkPermission('inventory.read')
  if (!canRead) redirect('/admin')

  const movement = await getMovementById(id)
  if (!movement) notFound()

  const date = new Date(movement.created_at)
  const dateLabel = date.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeLabel = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Detalle de movimiento"
        description="Los movimientos son inmutables. No pueden modificarse ni eliminarse."
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Inventario',  href: '/admin/inventory' },
          { label: 'Movimientos', href: '/admin/inventory/movements' },
          { label: `#${id.slice(0, 8)}` },
        ]}
        secondaryActions={
          movement.products && (
            <Link
              href={`/admin/inventory/${movement.product_id}`}
              className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
            >
              Ver inventario del producto →
            </Link>
          )
        }
      />

      <Alert variant="info">
        Registro inmutable — este movimiento no puede editarse ni eliminarse.
        Los errores se corrigen mediante movimientos compensatorios.
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Tipo y cantidades */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Movimiento</p>
            <MovementBadge type={movement.movement_type} />
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-lz-muted">Antes</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-lz-text">
                  {movement.quantity_before}
                </p>
              </div>
              <div>
                <p className="text-xs text-lz-muted">Cambio</p>
                <p
                  className={[
                    'mt-1 text-xl font-semibold tabular-nums',
                    movement.quantity >= 0 ? 'text-lz-success' : 'text-lz-danger',
                  ].join(' ')}
                >
                  {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-lz-muted">Después</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-lz-text">
                  {movement.quantity_after}
                </p>
              </div>
            </div>

            <div className="divide-y divide-lz-border/50 text-sm">
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">Motivo</span>
                <span className="text-lz-text text-right max-w-[60%]">
                  {movement.reason ?? '—'}
                </span>
              </div>
              {movement.notes && (
                <div className="flex justify-between py-2">
                  <span className="text-lz-muted">Notas</span>
                  <span className="text-lz-text text-right max-w-[60%]">
                    {movement.notes}
                  </span>
                </div>
              )}
              {movement.reference_type && (
                <div className="flex justify-between py-2">
                  <span className="text-lz-muted">Referencia</span>
                  <span className="font-mono text-xs text-lz-text">
                    {movement.reference_type}
                    {movement.reference_id ? ` · ${movement.reference_id.slice(0, 8)}` : ''}
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Producto y contexto */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Contexto</p>
          </CardHeader>
          <CardBody>
            <div className="divide-y divide-lz-border/50 text-sm">
              {movement.products && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-lz-muted">Producto</span>
                    <Link
                      href={`/admin/inventory/${movement.product_id}`}
                      className="font-medium text-lz-text hover:text-lz-accent transition-colors"
                    >
                      {movement.products.name}
                    </Link>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-lz-muted">SKU</span>
                    <span className="font-mono text-xs text-lz-text">
                      {movement.products.sku}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">Ubicación</span>
                <span className="text-lz-text">
                  {movement.inventory_locations
                    ? `${movement.inventory_locations.name} (${movement.inventory_locations.code})`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">Usuario</span>
                <span className="text-lz-text">
                  {movement.profiles?.full_name ?? 'Sistema'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">Fecha</span>
                <span className="text-right text-lz-text capitalize">
                  {dateLabel}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">Hora</span>
                <span className="tabular-nums text-lz-muted">{timeLabel}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-lz-muted">ID</span>
                <span className="font-mono text-[10px] text-lz-muted">{movement.id}</span>
              </div>
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  )
}
