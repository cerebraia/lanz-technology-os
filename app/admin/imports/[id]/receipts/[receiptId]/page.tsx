import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import {
  getImportReceiptById,
  getReceiptMovements,
} from '@/features/imports/data/receipts'
import { getItemDerived } from '@/features/imports/data/constants'
import { RECEIPT_STATUS_LABELS, IMPORT_STATUS_LABELS } from '@/features/imports/data/constants'
import { ReceiptConfirmButton } from '@/features/imports/components/receipt-confirm-button'
import { ReceiptItemsEditor }   from '@/features/imports/components/receipt-items-editor'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconBox }     from '@/components/icons'

export const metadata: Metadata = { title: 'Detalle de recepción' }

type Props = { params: Promise<{ id: string; receiptId: string }> }

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
function fmtTime(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id, receiptId } = await params
  await verifySession()

  const canRead = await checkPermission('imports.receipts.read')
  if (!canRead) redirect('/admin')

  const [imp, receipt, canUpdate, canConfirm, canCancel] = await Promise.all([
    getImportById(id),
    getImportReceiptById(receiptId),
    checkPermission('imports.receipts.update'),
    checkPermission('imports.receipts.confirm'),
    checkPermission('imports.receipts.cancel'),
  ])

  if (!imp || !receipt) notFound()

  const isDraft      = receipt.status === 'draft'
  const isConfirmed  = receipt.status === 'confirmed'
  const movements    = isConfirmed ? await getReceiptMovements(receiptId) : []
  const statusDef    = RECEIPT_STATUS_LABELS[receipt.status]
  const importStatus = IMPORT_STATUS_LABELS[imp.status]

  const hasReceived = receipt.items.some((i) => i.received_quantity > 0)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={receipt.reference}
        description={`Importación ${imp.reference}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Recepciones',   href: `/admin/imports/${id}/receipts` },
          { label: receipt.reference },
        ]}
        secondaryActions={
          <Badge variant={statusDef?.variant ?? 'neutral'}>{statusDef?.label ?? receipt.status}</Badge>
        }
        actions={
          isDraft ? (
            <ReceiptConfirmButton
              receiptId={receiptId}
              importId={id}
              hasReceived={hasReceived}
              canConfirm={canConfirm}
              canCancel={canCancel}
            />
          ) : undefined
        }
      />

      {isConfirmed && (
        <Alert variant="success">
          Recepción confirmada el {fmtTime(receipt.confirmed_at)}. El inventario fue actualizado. Este registro es de solo lectura.
        </Alert>
      )}

      {receipt.status === 'cancelled' && (
        <Alert variant="danger">
          Recepción cancelada el {fmtTime(receipt.cancelled_at)}. No se generaron movimientos de inventario.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Resumen izquierdo */}
        <div className="space-y-6">

          {/* Info */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Información</p>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-lz-border/50 text-sm">
                {[
                  { label: 'Referencia',  value: receipt.reference },
                  { label: 'Estado',      value: statusDef?.label ?? receipt.status },
                  { label: 'Importación', value: imp.reference },
                  {
                    label: 'Est. importación',
                    value: importStatus?.label ?? imp.status,
                  },
                  {
                    label: 'Ubicación',
                    value: receipt.inventory_locations
                      ? `${receipt.inventory_locations.code} — ${receipt.inventory_locations.name}`
                      : '—',
                  },
                  { label: 'Recibido el',  value: fmt(receipt.received_at) },
                  { label: 'Confirmado el', value: fmtTime(receipt.confirmed_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <dt className="shrink-0 text-lz-muted">{label}</dt>
                    <dd className="truncate text-right text-lz-text">{value}</dd>
                  </div>
                ))}
                {receipt.notes && (
                  <div className="py-2 last:pb-0">
                    <dt className="mb-1 text-lz-muted">Notas</dt>
                    <dd className="text-lz-text">{receipt.notes}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Resumen de totales */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Resumen de cantidades</p>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-lz-border/50 text-sm">
                {[
                  { label: 'Esperado total',  value: receipt.total_expected, color: 'text-lz-muted'   },
                  { label: 'Recibido',        value: receipt.total_received, color: 'text-lz-text'    },
                  { label: 'Aceptado',        value: receipt.total_accepted, color: 'text-lz-success' },
                  { label: 'Dañado',          value: receipt.total_damaged,  color: receipt.total_damaged > 0  ? 'text-lz-warning' : 'text-lz-muted' },
                  { label: 'Faltante',        value: receipt.total_missing,  color: receipt.total_missing > 0  ? 'text-lz-danger'  : 'text-lz-muted' },
                  { label: 'Sobrante',        value: receipt.total_excess,   color: receipt.total_excess  > 0  ? 'text-lz-info'    : 'text-lz-muted' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                    <dt className="text-lz-muted">{label}</dt>
                    <dd className={['tabular-nums font-medium', color].join(' ')}>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>

        {/* Productos + movimientos */}
        <div className="space-y-6 lg:col-span-2">

          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">
                  {isDraft ? 'Registrar cantidades' : 'Productos recibidos'}
                </p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {receipt.items.length} {receipt.items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isDraft && canUpdate ? (
                <ReceiptItemsEditor
                  receiptId={receiptId}
                  importId={id}
                  items={receipt.items}
                />
              ) : (
                receipt.items.length === 0 ? (
                  <p className="text-sm text-lz-muted">Sin líneas de producto.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-lz-border">
                    <table className="w-full text-sm">
                      <thead className="border-b border-lz-border bg-lz-sidebar">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Recibido</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Aceptado</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Dañado</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">Faltante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.items.map((item) => {
                          const { accepted, missing, excess } = getItemDerived(item)
                          return (
                            <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                              <td className="px-3 py-3">
                                <p className="text-sm font-medium text-lz-text">{item.products?.name ?? '—'}</p>
                                <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-sm text-lz-text">{item.received_quantity}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-sm font-medium text-lz-success">{accepted}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-sm hidden sm:table-cell">
                                <span className={item.damaged_quantity > 0 ? 'text-lz-warning' : 'text-lz-muted'}>
                                  {item.damaged_quantity || '—'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums text-sm hidden md:table-cell">
                                {missing > 0 ? (
                                  <span className="text-lz-danger">-{missing}</span>
                                ) : excess > 0 ? (
                                  <span className="text-lz-info">+{excess}</span>
                                ) : (
                                  <span className="text-lz-muted">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardBody>
          </Card>

          {/* Movimientos generados */}
          {isConfirmed && (
            <Card padding={false}>
              <CardHeader>
                <div>
                  <p className="text-sm font-semibold text-lz-text">Movimientos de inventario</p>
                  <p className="mt-0.5 text-xs text-lz-muted">Generados al confirmar esta recepción</p>
                </div>
              </CardHeader>
              {movements.length === 0 ? (
                <CardBody>
                  <EmptyState
                    icon={<IconBox size={18} className="text-lz-muted" />}
                    title="Sin movimientos vinculados"
                    description="No se encontraron movimientos para esta recepción."
                  />
                </CardBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-lz-border bg-lz-sidebar">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Cantidad</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Antes</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Después</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">Fecha</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(movements as any[]).map((mov) => (
                        <tr key={mov.id} className="border-b border-lz-border/50 last:border-0">
                          <td className="px-4 py-3">
                            <p className="text-sm text-lz-text">{mov.products?.name ?? '—'}</p>
                            <p className="font-mono text-xs text-lz-muted">{mov.products?.sku ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-lz-success">
                            +{mov.quantity}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-xs text-lz-muted hidden sm:table-cell">
                            {mov.quantity_before}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
                            {mov.quantity_after}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-lz-muted hidden md:table-cell">
                            {fmtTime(mov.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/inventory/movements/${mov.id}`}
                              className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
                            >
                              Ver
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
