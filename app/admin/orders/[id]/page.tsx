import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getOrderById, getProductsForOrder } from '@/features/orders/data/orders'
import { getPaymentsByOrder }   from '@/features/orders/data/payments'
import { getShipmentsByOrder }  from '@/features/orders/data/shipments'
import {
  ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS,
  SHIPMENT_STATUS_LABELS, SALE_CHANNEL_LABELS,
} from '@/features/orders/data/constants'
import { OrderItemsManager }  from '@/features/orders/components/order-items-manager'
import { OrderStatusActions } from '@/features/orders/components/order-status-actions'
import { PaymentForm }        from '@/features/orders/components/payment-form'
import { ShipmentForm }       from '@/features/orders/components/shipment-form'
import { PageHeader }         from '@/components/ui/page-header'
import { Badge }              from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import type { Payment }   from '@/features/orders/data/payments'
import type { Shipment }  from '@/features/orders/data/shipments'
import type { OrderStatusHistory } from '@/features/orders/data/orders'

export const metadata: Metadata = { title: 'Detalle del pedido' }

type Props = { params: Promise<{ id: string }> }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead   = await checkPermission('orders.read')
  if (!canRead) redirect('/admin/orders')
  const canUpdate  = await checkPermission('orders.update')
  const canCancel  = await checkPermission('orders.cancel')
  const canShip    = await checkPermission('orders.ship')
  const canPayment = await checkPermission('payments.manage')

  const [order, payments, shipments, allProducts] = await Promise.all([
    getOrderById(id),
    getPaymentsByOrder(id),
    getShipmentsByOrder(id),
    canUpdate ? getProductsForOrder() : Promise.resolve([]),
  ])

  if (!order) notFound()

  const isDraft   = order.status === 'draft'
  const isClosed  = ['cancelled', 'refunded', 'delivered'].includes(order.status)

  const orderStatus = ORDER_STATUS_LABELS[order.status]
  const payStatus   = PAYMENT_STATUS_LABELS[order.payment_status]

  const paidAmount    = payments.filter((p) => p.status === 'confirmed').reduce((a, p) => a + p.amount, 0)
  const pendingAmount = Math.max(0, order.total_amount - paidAmount)

  const productOptions = allProducts.map((p) => ({
    value: p.id,
    label: `[${p.sku}] ${p.name}`,
    price: p.sale_price,
  }))

  const customerName = order.customers
    ? `${order.customers.first_name} ${order.customers.last_name ?? ''}`.trim()
    : 'Sin cliente'

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={order.order_number}
        description={`${customerName} · ${SALE_CHANNEL_LABELS[order.sale_channel] ?? order.sale_channel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Pedidos',   href: '/admin/orders' },
          { label: order.order_number },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            <Badge variant={orderStatus?.variant ?? 'neutral'}>{orderStatus?.label ?? order.status}</Badge>
            <Badge variant={payStatus?.variant ?? 'neutral'}>{payStatus?.label ?? order.payment_status}</Badge>
          </div>
        }
        actions={
          <OrderStatusActions
            orderId={id}
            status={order.status}
            canUpdate={canUpdate}
            canCancel={canCancel}
            canShip={canShip}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Cliente + Resumen */}
        <div className="space-y-6 lg:col-span-1">
          {/* Cliente */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Cliente</p></CardHeader>
            <CardBody>
              {order.customers ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-lz-text">{customerName}</p>
                  {order.customers.email && <p className="text-xs text-lz-muted">{order.customers.email}</p>}
                  {order.customers.phone && <p className="text-xs text-lz-muted">{order.customers.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-lz-muted">Sin cliente asignado.</p>
              )}
            </CardBody>
          </Card>

          {/* Resumen financiero */}
          <Card>
            <p className="mb-3 text-sm font-semibold text-lz-text">Resumen</p>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Subtotal',   value: `${order.currency_code} ${order.subtotal.toFixed(2)}` },
                { label: 'Impuestos',  value: `${order.currency_code} ${order.taxes.toFixed(2)}` },
                { label: 'Envío',      value: `${order.currency_code} ${order.shipping.toFixed(2)}` },
                { label: 'Descuento',  value: `- ${order.currency_code} ${order.discount_amount.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-lz-muted">
                  <span className="text-xs">{label}</span>
                  <span className="tabular-nums text-xs">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-lz-border pt-2">
                <span className="text-sm font-semibold text-lz-text">Total</span>
                <span className="tabular-nums text-sm font-bold text-lz-text">
                  {order.currency_code} {order.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-lz-muted">Pagado</span>
                <span className="tabular-nums text-xs text-lz-success">{order.currency_code} {paidAmount.toFixed(2)}</span>
              </div>
              {pendingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-lz-muted">Pendiente</span>
                  <span className="tabular-nums text-xs text-lz-warning">{order.currency_code} {pendingAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Notas */}
          {order.notes && (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lz-muted">Notas</p>
              <p className="text-sm text-lz-text">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Right — Productos, Pagos, Envíos, Historial */}
        <div className="space-y-6 lg:col-span-2">
          {/* Productos */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Productos</p></CardHeader>
            <CardBody>
              <OrderItemsManager
                orderId={id}
                items={order.order_items ?? []}
                products={productOptions}
                currency={order.currency_code}
                readOnly={!isDraft || !canUpdate}
              />
            </CardBody>
          </Card>

          {/* Pagos */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Pagos</p>
            </CardHeader>
            <CardBody>
              {payments.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin pagos registrados.</p>
              ) : (
                <ul className="mb-4 divide-y divide-lz-border/50">
                  {payments.map((p: Payment) => {
                    const ps = { pending: 'neutral', confirmed: 'success', rejected: 'danger', refunded: 'info' } as const
                    return (
                      <li key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm text-lz-text">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</p>
                          {p.reference && <p className="text-xs text-lz-muted">Ref: {p.reference}</p>}
                          <p className="text-xs text-lz-muted">{fmtDate(p.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-sm font-semibold">{p.currency} {p.amount.toFixed(2)}</span>
                          <Badge variant={ps[p.status as keyof typeof ps] ?? 'neutral'}>{p.status}</Badge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {canPayment && !isClosed && (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lz-muted">Registrar pago</p>
                  <PaymentForm orderId={id} pendingAmount={pendingAmount} currency={order.currency_code} />
                </>
              )}
            </CardBody>
          </Card>

          {/* Envíos */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Envíos</p></CardHeader>
            <CardBody>
              {shipments.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin envíos registrados.</p>
              ) : (
                <ul className="mb-4 divide-y divide-lz-border/50">
                  {shipments.map((s: Shipment) => {
                    const ss = SHIPMENT_STATUS_LABELS[s.status]
                    return (
                      <li key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm text-lz-text">{s.carrier ?? 'Sin transportista'}</p>
                          {s.tracking_number && <p className="font-mono text-xs text-lz-muted">#{s.tracking_number}</p>}
                          {s.shipped_at && <p className="text-xs text-lz-muted">{fmtDate(s.shipped_at)}</p>}
                        </div>
                        <Badge variant={ss?.variant ?? 'neutral'}>{ss?.label ?? s.status}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
              {canShip && !isClosed && (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lz-muted">Registrar envío</p>
                  <ShipmentForm orderId={id} />
                </>
              )}
            </CardBody>
          </Card>

          {/* Historial */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Historial de estado</p></CardHeader>
            <CardBody>
              {(order.order_status_history ?? []).length === 0 ? (
                <p className="text-sm text-lz-muted">Sin historial.</p>
              ) : (
                <ol className="relative space-y-0 pl-6">
                  <div className="absolute left-2.5 top-0 h-full w-px bg-lz-border/60" aria-hidden="true" />
                  {[...(order.order_status_history ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((h: OrderStatusHistory) => {
                    const ns = ORDER_STATUS_LABELS[h.new_status]
                    return (
                      <li key={h.id} className="relative pb-5 last:pb-0">
                        <span className="absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full border-2 border-lz-bg bg-lz-primary" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-lz-muted">
                          {ns?.label ?? h.new_status}
                        </p>
                        {h.notes && <p className="mt-0.5 text-xs text-lz-text">{h.notes}</p>}
                        <p className="mt-0.5 text-[11px] text-lz-muted">{fmtDate(h.created_at)}</p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
