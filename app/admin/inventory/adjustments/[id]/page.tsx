import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import {
  getAdjustmentById,
  ADJUSTMENT_STATUS_LABELS,
} from '@/features/inventory/data/adjustments'
import { getMovementsFiltered, MOVEMENT_TYPE_LABELS } from '@/features/inventory/data/inventory'
import { AdjustmentItemsManager } from '@/features/inventory/components/adjustment-items-manager'
import { AdjustmentActions } from '@/features/inventory/components/confirm-adjustment-button'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { IconBox } from '@/components/icons'
import type { InventoryMovementRow } from '@/features/inventory/data/inventory'

export const metadata: Metadata = { title: 'Detalle de ajuste' }

type Props = { params: Promise<{ id: string }> }

async function getActiveProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('status', 'active')
    .is('archived_at', null)
    .order('name')
  return (data ?? []).map((p) => ({ value: p.id, label: `${p.name} — ${p.sku}` }))
}

const MOVEMENT_COLUMNS = [
  {
    key: 'created_at',
    header: 'Fecha',
    className: 'w-32',
    render: (row: InventoryMovementRow) => (
      <span className="text-xs text-lz-muted">
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
        <p className="text-sm text-lz-text">{row.products?.name ?? '—'}</p>
        <p className="font-mono text-[10px] text-lz-muted">{row.products?.sku ?? '—'}</p>
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
    className: 'text-right',
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
    key: 'before',
    header: 'Antes',
    className: 'hidden sm:table-cell text-right',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_before}</span>
    ),
  },
  {
    key: 'after',
    header: 'Después',
    className: 'hidden sm:table-cell text-right',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_after}</span>
    ),
  },
  {
    key: 'link',
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

export default async function AdjustmentDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead = await checkPermission('inventory.adjustments.read')
  if (!canRead) redirect('/admin')

  const [adjustment, products] = await Promise.all([
    getAdjustmentById(id),
    getActiveProducts(),
  ])

  if (!adjustment) notFound()

  const canConfirm = await checkPermission('inventory.adjustments.confirm')
  const canCancel  = await checkPermission('inventory.adjustments.cancel')
  const isDraft    = adjustment.status === 'draft'
  const hasChanges = adjustment.items.some((i) => i.difference !== 0)

  const movements = adjustment.status === 'confirmed'
    ? await getMovementsFiltered({ referenceId: id })
    : []

  const st = ADJUSTMENT_STATUS_LABELS[adjustment.status] ?? { label: adjustment.status, variant: 'neutral' as const }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adj = adjustment as any
  const createdName    = adj.created_by_profile?.full_name
  const confirmedName  = adj.confirmed_by_profile?.full_name
  const cancelledName  = adj.cancelled_by_profile?.full_name

  // Resumen de diferencias
  const totalAdded   = adjustment.items.filter((i) => i.difference > 0).reduce((a, i) => a + i.difference, 0)
  const totalRemoved = adjustment.items.filter((i) => i.difference < 0).reduce((a, i) => a + Math.abs(i.difference), 0)
  const adjusted     = adjustment.items.filter((i) => i.difference !== 0).length

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={adjustment.reference}
        description={adjustment.reason}
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Ajustes',    href: '/admin/inventory/adjustments' },
          { label: adjustment.reference },
        ]}
        secondaryActions={<Badge variant={st.variant}>{st.label}</Badge>}
        actions={
          isDraft ? (
            <AdjustmentActions
              adjustmentId={id}
              hasChanges={hasChanges}
              canConfirm={canConfirm}
              canCancel={canCancel}
            />
          ) : undefined
        }
      />

      {adjustment.status === 'confirmed' && (
        <Alert variant="info">
          Ajuste confirmado el{' '}
          {adjustment.confirmed_at
            ? new Date(adjustment.confirmed_at).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
            : '—'}
          {confirmedName ? ` por ${confirmedName}` : ''}.
          El registro es inmutable — los errores se corrigen con un nuevo ajuste.
        </Alert>
      )}

      {adjustment.status === 'cancelled' && (
        <Alert variant="danger">
          Ajuste cancelado{cancelledName ? ` por ${cancelledName}` : ''}.
          No se generaron movimientos de inventario.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Info + resumen */}
        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Información general</p>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-lz-border/50 text-sm">
                {[
                  { label: 'Referencia', value: adjustment.reference },
                  { label: 'Motivo',     value: adjustment.reason },
                  { label: 'Estado',     value: st.label },
                  { label: 'Creado por', value: createdName ?? '—' },
                  { label: 'Fecha',      value: new Date(adjustment.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                    <dt className="text-lz-muted">{label}</dt>
                    <dd className="text-lz-text">{value}</dd>
                  </div>
                ))}
                {adjustment.notes && (
                  <div className="py-2 last:pb-0">
                    <dt className="text-lz-muted">Notas</dt>
                    <dd className="mt-1 text-lz-text">{adjustment.notes}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {adjustment.items.length > 0 && (
            <Card padding={false}>
              <CardHeader>
                <p className="text-sm font-semibold text-lz-text">Resumen</p>
              </CardHeader>
              <CardBody>
                <dl className="divide-y divide-lz-border/50 text-sm">
                  {[
                    { label: 'Productos',          value: String(adjustment.items.length) },
                    { label: 'Con diferencias',    value: String(adjusted) },
                    { label: 'Unidades agregadas', value: `+${totalAdded}`, cls: 'text-lz-success' },
                    { label: 'Unidades descontadas', value: `-${totalRemoved}`, cls: 'text-lz-danger' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                      <dt className="text-lz-muted">{label}</dt>
                      <dd className={['font-medium', cls ?? 'text-lz-text'].join(' ')}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Items */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Conteos físicos</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {adjustment.items.length} {adjustment.items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isDraft ? (
                <AdjustmentItemsManager
                  adjustmentId={id}
                  items={adjustment.items}
                  products={products}
                />
              ) : (
                adjustment.items.length === 0 ? (
                  <p className="text-sm text-lz-muted">Sin productos registrados.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-lz-border">
                    <table className="w-full text-sm">
                      <thead className="border-b border-lz-border bg-lz-sidebar">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Sistema</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Conteo</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adjustment.items.map((item) => (
                          <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-sm text-lz-text">{item.products?.name ?? '—'}</p>
                              <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-muted">{item.current_stock}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">{item.physical_stock}</td>
                            <td className="px-4 py-3 text-center">
                              {item.difference > 0 && <Badge variant="success">+{item.difference}</Badge>}
                              {item.difference < 0 && <Badge variant="danger">{item.difference}</Badge>}
                              {item.difference === 0 && <Badge variant="neutral">Sin cambio</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardBody>
          </Card>
        </div>

      </div>

      {/* Movimientos generados */}
      {adjustment.status === 'confirmed' && (
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Movimientos generados</p>
              <p className="mt-0.5 text-xs text-lz-muted">
                Creados automáticamente al confirmar el ajuste
              </p>
            </div>
          </CardHeader>
          {movements.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<IconBox size={18} className="text-lz-muted" />}
                title="Sin movimientos vinculados"
                description="Los movimientos se registran referenciando este ajuste."
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
      )}
    </div>
  )
}
