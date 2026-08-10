import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import {
  getPurchaseOrderById,
  PURCHASE_STATUS_LABELS,
  type PurchaseOrderItem,
} from '@/features/purchases/data/purchases'
import { PurchaseItemsManager } from '@/features/purchases/components/purchase-items-manager'
import { PurchaseStatusActions } from '@/features/purchases/components/purchase-status-actions'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'

export const metadata: Metadata = { title: 'Detalle de orden de compra' }

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

// ─── Items table (read-only) ──────────────────────────────────────────────────

function ItemsTable({ items, currency }: { items: PurchaseOrderItem[]; currency: string }) {
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0)
  const subtotal   = items.reduce((acc, i) => acc + i.total,    0)

  if (items.length === 0) {
    return <p className="text-sm text-lz-muted">Sin productos registrados.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-lz-border">
      <table className="w-full text-sm">
        <thead className="border-b border-lz-border bg-lz-sidebar">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Cant.</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Costo unit.</th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
              <td className="px-4 py-3">
                <p className="text-sm text-lz-text">{item.products?.name ?? '—'}</p>
                <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">{item.quantity}</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text hidden sm:table-cell">
                {item.unit_cost.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-lz-text">
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-lz-border bg-lz-surface/50">
          <tr>
            <td className="px-4 py-2 text-xs font-medium text-lz-muted">
              {items.length} {items.length === 1 ? 'producto' : 'productos'} · {totalUnits} unidades
            </td>
            <td colSpan={1} className="hidden sm:table-cell" />
            <td colSpan={2} className="px-4 py-2 text-right tabular-nums text-sm font-semibold text-lz-text">
              {currency} {subtotal.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PurchaseDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canRead = await checkPermission('purchases.read')
  if (!canRead) redirect('/admin')

  const [order, canSend, canCancel, canUpdate] = await Promise.all([
    getPurchaseOrderById(id),
    checkPermission('purchases.send'),
    checkPermission('purchases.cancel'),
    checkPermission('purchases.update'),
  ])

  if (!order) notFound()

  const isDraft   = order.status === 'draft'
  const products  = isDraft && canUpdate ? await getActiveProducts() : []
  const statusDef = PURCHASE_STATUS_LABELS[order.status]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={order.reference}
        description={order.supplier_name ?? 'Sin proveedor'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Compras',   href: '/admin/purchases' },
          { label: order.reference },
        ]}
        secondaryActions={
          <Badge variant={statusDef?.variant ?? 'neutral'}>
            {statusDef?.label ?? order.status}
          </Badge>
        }
        actions={
          <PurchaseStatusActions
            orderId={id}
            totalItems={order.items.length}
            status={order.status}
            canSend={canSend}
            canCancel={canCancel}
          />
        }
      />

      {order.status === 'sent' && (
        <Alert variant="info">
          Orden enviada el{' '}
          {order.sent_at
            ? new Date(order.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
            : '—'}.
          Cuando la mercancía llegue, registra la recepción en{' '}
          <Link href="/admin/inventory/entries" className="underline underline-offset-2 hover:text-lz-accent">
            Entradas de inventario
          </Link>.
        </Alert>
      )}

      {order.status === 'cancelled' && (
        <Alert variant="danger">
          Orden cancelada. No se puede reactivar ni modificar.
        </Alert>
      )}

      {order.status === 'completed' && (
        <Alert variant="success">
          Orden completada. Toda la mercancía fue recibida en inventario.
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
                { label: 'Referencia', value: order.reference },
                { label: 'Proveedor',  value: order.supplier_name ?? '—' },
                { label: 'Moneda',     value: order.currency },
                { label: 'Estado',     value: statusDef?.label ?? order.status },
                { label: 'Subtotal',   value: `${order.currency} ${order.subtotal.toFixed(2)}` },
                {
                  label: 'Creada el',
                  value: new Date(order.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <dt className="text-lz-muted">{label}</dt>
                  <dd className="text-lz-text">{value}</dd>
                </div>
              ))}
              {order.notes && (
                <div className="py-2 last:pb-0">
                  <dt className="mb-1 text-lz-muted">Observaciones</dt>
                  <dd className="text-lz-text">{order.notes}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Productos */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Productos</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'} ·{' '}
                  {order.items.reduce((a, i) => a + i.quantity, 0)} unidades
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {isDraft && canUpdate ? (
                <PurchaseItemsManager
                  orderId={id}
                  items={order.items}
                  products={products}
                  currency={order.currency}
                />
              ) : (
                <ItemsTable items={order.items} currency={order.currency} />
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  )
}
