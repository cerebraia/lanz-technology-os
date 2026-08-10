import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { getEntryById, ENTRY_TYPE_LABELS, ENTRY_STATUS_LABELS } from '@/features/inventory/data/entries'
import { getMovementsFiltered, MOVEMENT_TYPE_LABELS } from '@/features/inventory/data/inventory'
import { EntryItemsManager } from '@/features/inventory/components/entry-items-manager'
import { EntryActions } from '@/features/inventory/components/confirm-entry-button'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { IconBox } from '@/components/icons'
import type { InventoryMovementRow } from '@/features/inventory/data/inventory'

export const metadata: Metadata = { title: 'Detalle de entrada' }

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
      <span className="tabular-nums text-sm font-semibold text-lz-success">
        +{row.quantity}
      </span>
    ),
  },
  {
    key: 'after',
    header: 'Saldo',
    className: 'hidden sm:table-cell text-right',
    render: (row: InventoryMovementRow) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.quantity_after}</span>
    ),
  },
  {
    key: 'detail',
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

export default async function EntryDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead    = await checkPermission('inventory.entries.read')
  if (!canRead) redirect('/admin')

  const [entry, products] = await Promise.all([
    getEntryById(id),
    getActiveProducts(),
  ])

  if (!entry) notFound()

  const canConfirm = await checkPermission('inventory.entries.confirm')
  const canCancel  = await checkPermission('inventory.entries.cancel')
  const isDraft    = entry.status === 'draft'

  // Movimientos generados por esta entrada (referencia inventory_entry + id)
  const movements = entry.status === 'confirmed'
    ? await getMovementsFiltered({ referenceId: id })
    : []

  const st          = ENTRY_STATUS_LABELS[entry.status] ?? { label: entry.status, variant: 'neutral' as const }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createdName  = (entry as any).created_by_profile?.full_name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmedName = (entry as any).confirmed_by_profile?.full_name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelledName = (entry as any).cancelled_by_profile?.full_name

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={entry.reference}
        description={entry.supplier_name ?? ENTRY_TYPE_LABELS[entry.entry_type] ?? ''}
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Entradas',   href: '/admin/inventory/entries' },
          { label: entry.reference },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            <Badge variant={st.variant}>{st.label}</Badge>
            <Badge variant="neutral">{ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type}</Badge>
          </div>
        }
        actions={
          isDraft ? (
            <EntryActions
              entryId={id}
              totalItems={entry.items.length}
              canConfirm={canConfirm}
              canCancel={canCancel}
            />
          ) : undefined
        }
      />

      {entry.status === 'confirmed' && (
        <Alert variant="info">
          Entrada confirmada el{' '}
          {entry.confirmed_at
            ? new Date(entry.confirmed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
            : '—'}
          {confirmedName ? ` por ${confirmedName}` : ''}.
          El registro es inmutable — los errores se corrigen con ajustes.
        </Alert>
      )}

      {entry.status === 'cancelled' && (
        <Alert variant="danger">
          Entrada cancelada{cancelledName ? ` por ${cancelledName}` : ''}.
          No se generaron movimientos de inventario.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Info general */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Información general</p>
          </CardHeader>
          <CardBody>
            <dl className="divide-y divide-lz-border/50 text-sm">
              {[
                { label: 'Referencia', value: entry.reference },
                { label: 'Tipo',       value: ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type },
                { label: 'Estado',     value: st.label },
                { label: 'Proveedor',  value: entry.supplier_name ?? '—' },
                { label: 'Unidades',   value: String(entry.total_units || entry.items.reduce((a, i) => a + i.quantity, 0)) },
                { label: 'Creado por', value: createdName ?? '—' },
                { label: 'Creado el',  value: new Date(entry.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <dt className="text-lz-muted">{label}</dt>
                  <dd className="text-lz-text">{value}</dd>
                </div>
              ))}
              {entry.notes && (
                <div className="py-2 last:pb-0">
                  <dt className="text-lz-muted">Notas</dt>
                  <dd className="mt-1 text-lz-text">{entry.notes}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Items */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Productos</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {entry.items.length} {entry.items.length === 1 ? 'producto' : 'productos'} ·{' '}
                  {entry.items.reduce((a, i) => a + i.quantity, 0)} unidades
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isDraft ? (
                <EntryItemsManager
                  entryId={id}
                  items={entry.items}
                  products={products}
                />
              ) : (
                entry.items.length === 0 ? (
                  <p className="text-sm text-lz-muted">Sin productos registrados.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-lz-border">
                    <table className="w-full text-sm">
                      <thead className="border-b border-lz-border bg-lz-sidebar">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Cant.</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item) => (
                          <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                            <td className="px-4 py-3">
                              <p className="text-sm text-lz-text">{item.products?.name ?? '—'}</p>
                              <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-xs text-lz-muted hidden sm:table-cell">
                              {item.notes ?? '—'}
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
      {entry.status === 'confirmed' && (
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Movimientos generados</p>
              <p className="mt-0.5 text-xs text-lz-muted">
                Creados automáticamente al confirmar esta entrada
              </p>
            </div>
          </CardHeader>

          {movements.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<IconBox size={18} className="text-lz-muted" />}
                title="Sin movimientos vinculados"
                description="Los movimientos aparecerán aquí si se confirman con esta referencia."
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
