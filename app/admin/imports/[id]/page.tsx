import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getImportById,
  getAvailablePurchaseOrders,
  IMPORT_STATUS_LABELS,
  IMPORT_STATUS_STAGES,
  SHIPPING_METHOD_LABELS,
  type ImportStatus,
} from '@/features/imports/data/imports'
import { ImportStatusActions } from '@/features/imports/components/import-status-actions'
import { ImportOrdersManager }  from '@/features/imports/components/import-orders-manager'
import { ImportExpensesManager } from '@/features/imports/components/import-expenses-manager'
import { Timeline, type TimelineItem } from '@/components/ui/timeline'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { getImportReceipts } from '@/features/imports/data/receipts'
import { RECEIPT_STATUS_LABELS } from '@/features/imports/data/constants'

export const metadata: Metadata = { title: 'Detalle de importación' }

type Props = { params: Promise<{ id: string }> }

function formatDate(d?: string | null) {
  if (!d) return null
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function buildTimeline(imp: {
  status:              string
  estimated_departure: string | null
  estimated_arrival:   string | null
  actual_arrival:      string | null
  created_at:          string
}): TimelineItem[] {
  const currentIdx = IMPORT_STATUS_STAGES.indexOf(imp.status as ImportStatus)

  return [
    {
      label:    'Planificación',
      date:     formatDate(imp.created_at),
      status:   currentIdx > 0 ? 'done' : currentIdx === 0 ? 'current' : 'pending',
    },
    {
      label:    'Comprado',
      status:   currentIdx > 1 ? 'done' : currentIdx === 1 ? 'current' : 'pending',
    },
    {
      label:    'En tránsito',
      date:     imp.estimated_departure ? `Salida est. ${formatDate(imp.estimated_departure)}` : null,
      status:   currentIdx > 2 ? 'done' : currentIdx === 2 ? 'current' : 'pending',
    },
    {
      label:    'En aduana',
      status:   currentIdx > 3 ? 'done' : currentIdx === 3 ? 'current' : 'pending',
    },
    {
      label:    'Recibido',
      date:     imp.actual_arrival
        ? `Llegada real: ${formatDate(imp.actual_arrival)}`
        : imp.estimated_arrival
          ? `Llegada est. ${formatDate(imp.estimated_arrival)}`
          : null,
      status:   currentIdx === 4 ? 'done' : 'pending',
    },
  ]
}

export default async function ImportDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canRead = await checkPermission('imports.read')
  if (!canRead) redirect('/admin')

  const [imp, canUpdate, canReceive, canCosts, canProfit] = await Promise.all([
    getImportById(id),
    checkPermission('imports.update'),
    checkPermission('imports.receive'),
    checkPermission('imports.costs.read'),
    checkPermission('imports.profitability.read'),
  ])

  if (!imp) notFound()

  const isEditable      = canUpdate && !['received', 'cancelled'].includes(imp.status)
  const canReceiveNow   = !['planning', 'purchased', 'received', 'cancelled'].includes(imp.status)
  const [availableOrders, receipts] = await Promise.all([
    isEditable ? getAvailablePurchaseOrders() : Promise.resolve([]),
    getImportReceipts(id),
  ])
  const statusDef       = IMPORT_STATUS_LABELS[imp.status]
  const timeline        = buildTimeline(imp)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={imp.reference}
        description={`${imp.origin_country} → ${imp.destination_country}${imp.shipping_method ? ` · ${SHIPPING_METHOD_LABELS[imp.shipping_method]}` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference },
        ]}
        secondaryActions={
          <Badge variant={statusDef?.variant ?? 'neutral'}>{statusDef?.label ?? imp.status}</Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canCosts && (
              <Link
                href={`/admin/imports/${id}/costs`}
                className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
              >
                Costos
              </Link>
            )}
            {canProfit && (
              <Link
                href={`/admin/imports/${id}/profitability`}
                className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
              >
                Rentabilidad
              </Link>
            )}
            {canUpdate && !['received', 'cancelled'].includes(imp.status) && (
              <Link
                href={`/admin/imports/${id}/edit`}
                className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
              >
                Editar
              </Link>
            )}
            <ImportStatusActions
              importId={id}
              status={imp.status}
              canUpdate={canUpdate}
              canReceive={canReceive}
            />
          </div>
        }
      />

      {imp.status === 'received' && (
        <Alert variant="success">
          Importación recibida el {formatDate(imp.actual_arrival) ?? '—'}. El inventario debe actualizarse mediante Entradas de inventario.
        </Alert>
      )}

      {imp.status === 'cancelled' && (
        <Alert variant="danger">
          Importación cancelada. No se pueden agregar órdenes ni gastos.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Info + Timeline */}
        <div className="space-y-6">

          {/* Resumen */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Resumen</p>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-lz-border/50 text-sm">
                {[
                  { label: 'Referencia',    value: imp.reference },
                  { label: 'Origen',        value: imp.origin_country },
                  { label: 'Destino',       value: imp.destination_country },
                  {
                    label: 'Método',
                    value: imp.shipping_method ? SHIPPING_METHOD_LABELS[imp.shipping_method] : '—',
                  },
                  { label: 'Salida est.',   value: formatDate(imp.estimated_departure) ?? '—' },
                  { label: 'Llegada est.',  value: formatDate(imp.estimated_arrival) ?? '—' },
                  { label: 'Llegada real',  value: formatDate(imp.actual_arrival) ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
                    <dt className="shrink-0 text-lz-muted">{label}</dt>
                    <dd className="truncate text-right text-lz-text">{value}</dd>
                  </div>
                ))}
                {imp.notes && (
                  <div className="py-2 last:pb-0">
                    <dt className="mb-1 text-lz-muted">Notas</dt>
                    <dd className="text-lz-text">{imp.notes}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Resumen financiero */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Costos</p>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-lz-border/50 text-sm">
                {[
                  { label: 'Mercancía',  value: `USD ${imp.total_merch.toFixed(2)}` },
                  { label: 'Logística',  value: `USD ${imp.total_expenses.toFixed(2)}` },
                  { label: 'Total',      value: `USD ${(imp.total_merch + imp.total_expenses).toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                    <dt className="text-lz-muted">{label}</dt>
                    <dd className="font-medium tabular-nums text-lz-text">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          {/* Cronología */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Cronología</p>
            </CardHeader>
            <CardBody>
              <Timeline items={timeline} />
            </CardBody>
          </Card>
        </div>

        {/* Órdenes + Gastos */}
        <div className="space-y-6 lg:col-span-2">

          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Órdenes de compra</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {imp.linked_orders.length} {imp.linked_orders.length === 1 ? 'orden' : 'órdenes'} vinculadas
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <ImportOrdersManager
                importId={id}
                linkedOrders={imp.linked_orders}
                availableOrders={availableOrders}
                editable={isEditable}
              />
            </CardBody>
          </Card>

          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Gastos logísticos</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {imp.expenses.length} {imp.expenses.length === 1 ? 'gasto' : 'gastos'} ·{' '}
                  USD {imp.total_expenses.toFixed(2)}
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <ImportExpensesManager
                importId={id}
                expenses={imp.expenses}
                editable={isEditable}
              />
            </CardBody>
          </Card>

          {/* Recepciones */}
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Recepciones de mercancía</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {receipts.length} {receipts.length === 1 ? 'recepción' : 'recepciones'} registradas
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canReceiveNow && (
                  <Link
                    href={`/admin/imports/${id}/receipts/new`}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-lz-primary px-2.5 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
                  >
                    + Registrar recepción
                  </Link>
                )}
                <Link
                  href={`/admin/imports/${id}/receipts`}
                  className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
                >
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {receipts.length === 0 ? (
                <p className="text-sm text-lz-muted">
                  Sin recepciones. Las recepciones de mercancía aparecerán aquí.
                </p>
              ) : (
                <div className="space-y-2">
                  {receipts.slice(0, 5).map((receipt) => {
                    const st = RECEIPT_STATUS_LABELS[receipt.status]
                    return (
                      <div key={receipt.id} className="flex items-center justify-between rounded-lg border border-lz-border px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-lz-text">{receipt.reference}</p>
                          <p className="text-xs text-lz-muted">
                            {new Date(receipt.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={st?.variant ?? 'neutral'}>{st?.label ?? receipt.status}</Badge>
                          <Link
                            href={`/admin/imports/${id}/receipts/${receipt.id}`}
                            className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  )
}
