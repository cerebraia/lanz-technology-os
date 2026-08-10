import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSaleById } from '@/features/sales/data/sales'
import { getPaymentsByOrder }  from '@/features/orders/data/payments'
import { getShipmentsByOrder } from '@/features/orders/data/shipments'
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SALE_CHANNEL_LABELS,
  SHIPMENT_STATUS_LABELS,
} from '@/features/orders/data/constants'
import { SaleStatusActions }   from '@/features/sales/components/sale-status-actions'
import { CancelSaleButton }    from '@/features/sales/components/cancel-sale-button'
import { SaleDetailsEditButton, SaleCustomerEditButton } from '@/features/sales/components/sale-edit-panel'
import { PaymentForm }         from '@/features/orders/components/payment-form'
import { ShipmentForm }        from '@/features/orders/components/shipment-form'
import { PageHeader }          from '@/components/ui/page-header'
import { Badge }               from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import type { Payment }  from '@/features/orders/data/payments'
import type { Shipment } from '@/features/orders/data/shipments'

export const metadata: Metadata = { title: 'Detalle de venta' }

type Props = { params: Promise<{ id: string }> }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead    = await checkPermission('orders.read')
  if (!canRead) redirect('/admin/sales')

  const canUpdate  = await checkPermission('orders.update')
  const canCancel  = await checkPermission('orders.cancel')
  const canShip    = await checkPermission('orders.ship')
  const canPayment = await checkPermission('payments.manage')
  const canEditCust = await checkPermission('customers.update')

  const [sale, payments, shipments] = await Promise.all([
    getSaleById(id),
    getPaymentsByOrder(id),
    getShipmentsByOrder(id),
  ])

  if (!sale) notFound()

  const isClosed  = ['cancelled', 'refunded', 'delivered'].includes(sale.status)
  const isDelivered = sale.status === 'delivered'

  const orderStatus = ORDER_STATUS_LABELS[sale.status]
  const payStatus   = PAYMENT_STATUS_LABELS[sale.payment_status]

  const paidAmount    = payments.filter((p) => p.status === 'confirmed').reduce((a, p) => a + p.amount, 0)
  const pendingAmount = Math.max(0, sale.total_amount - paidAmount)

  const customerName = sale.customers
    ? `${sale.customers.first_name} ${sale.customers.last_name ?? ''}`.trim()
    : 'Sin cliente'

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={sale.order_number}
        description={`${customerName} · ${SALE_CHANNEL_LABELS[sale.sale_channel] ?? sale.sale_channel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Ventas',    href: '/admin/sales' },
          { label: sale.order_number },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            <Badge variant={orderStatus?.variant ?? 'neutral'}>{orderStatus?.label ?? sale.status}</Badge>
            <Badge variant={payStatus?.variant ?? 'neutral'}>{payStatus?.label ?? sale.payment_status}</Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && <SaleStatusActions orderId={id} status={sale.status} canUpdate={canUpdate} canShip={canShip} />}
            {canCancel  && <CancelSaleButton orderId={id} status={sale.status} />}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="space-y-6 lg:col-span-1">

          {/* Cliente */}
          <Card padding={false}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-lz-text">Cliente</p>
                {sale.customers && canEditCust && !isDelivered && (
                  <SaleCustomerEditButton
                    customerId={sale.customers.id}
                    firstName={sale.customers.first_name}
                    lastName={sale.customers.last_name}
                    phone={sale.customers.phone}
                    email={sale.customers.email}
                    address={sale.customers.address}
                  />
                )}
              </div>
            </CardHeader>
            <CardBody>
              {sale.customers ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-lz-text">{customerName}</p>
                  {sale.customers.phone   && <p className="text-xs text-lz-muted">{sale.customers.phone}</p>}
                  {sale.customers.email   && <p className="text-xs text-lz-muted">{sale.customers.email}</p>}
                  {sale.customers.address && <p className="text-xs text-lz-muted">{sale.customers.address}</p>}
                  <div className="pt-2">
                    <Link
                      href={`/admin/crm/customers/${sale.customers.id}`}
                      className="text-xs text-lz-accent hover:underline"
                    >
                      Ver historial del cliente →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-lz-muted">Sin cliente asignado.</p>
              )}
            </CardBody>
          </Card>

          {/* Resumen financiero */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-lz-text">Resumen</p>
              {canUpdate && !isDelivered && (
                <SaleDetailsEditButton
                  orderId={id}
                  notes={sale.notes}
                  saleChannel={sale.sale_channel}
                  paymentMethod={sale.payment_method}
                />
              )}
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Subtotal',  value: `${sale.currency_code} ${sale.subtotal.toFixed(2)}` },
                { label: 'Descuento', value: `- ${sale.currency_code} ${sale.discount_amount.toFixed(2)}` },
                { label: 'Envío',     value: `${sale.currency_code} ${sale.shipping.toFixed(2)}` },
                { label: 'Impuestos', value: `${sale.currency_code} ${sale.taxes.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-lz-muted">
                  <span className="text-xs">{label}</span>
                  <span className="tabular-nums text-xs">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-lz-border pt-2">
                <span className="text-sm font-semibold text-lz-text">Total</span>
                <span className="tabular-nums text-sm font-bold text-lz-text">
                  {sale.currency_code} {sale.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-lz-muted">Pagado</span>
                <span className="tabular-nums text-xs text-lz-success">{sale.currency_code} {paidAmount.toFixed(2)}</span>
              </div>
              {pendingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-lz-muted">Pendiente</span>
                  <span className="tabular-nums text-xs text-lz-warning">{sale.currency_code} {pendingAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-4 space-y-1 border-t border-lz-border pt-4 text-xs text-lz-muted">
              <p>Canal: {SALE_CHANNEL_LABELS[sale.sale_channel] ?? sale.sale_channel}</p>
              {sale.payment_method && (
                <p>Pago: {PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method}</p>
              )}
              <p>Creada: {fmtDate(sale.created_at)}</p>
              {sale.cancel_reason && (
                <p className="text-lz-danger">Cancelada: {sale.cancel_reason}</p>
              )}
            </div>
          </Card>

          {/* Notas */}
          {sale.notes && (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lz-muted">Observaciones</p>
              <p className="text-sm text-lz-text">{sale.notes}</p>
            </Card>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Productos */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Productos</p>
            </CardHeader>
            <CardBody>
              {(sale.order_items ?? []).length === 0 ? (
                <p className="text-sm text-lz-muted">Sin productos.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-lz-border">
                  <table className="w-full text-sm">
                    <thead className="border-b border-lz-border bg-lz-sidebar">
                      <tr>
                        {['Producto', 'Cant.', 'Precio', 'Total'].map((h, i) => (
                          <th key={i} className={[
                            'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted',
                            i === 0 ? 'text-left' : 'text-right',
                            i === 2 ? 'hidden sm:table-cell' : '',
                          ].join(' ')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sale.order_items.map((item) => (
                        <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                          <td className="px-4 py-3">
                            <p className="text-sm text-lz-text">{item.product_name}</p>
                            <p className="font-mono text-xs text-lz-muted">{item.product_sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm hidden sm:table-cell">
                            {item.currency_code} {item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-lz-text">
                            {item.currency_code} {item.line_total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Pagos */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Pagos</p></CardHeader>
            <CardBody>
              {payments.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin pagos registrados.</p>
              ) : (
                <ul className="mb-4 divide-y divide-lz-border/50">
                  {payments.map((p: Payment) => {
                    const vs = { pending: 'neutral', confirmed: 'success', rejected: 'danger', refunded: 'info' } as const
                    return (
                      <li key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm text-lz-text">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</p>
                          {p.reference && <p className="text-xs text-lz-muted">Ref: {p.reference}</p>}
                          <p className="text-xs text-lz-muted">{fmtDate(p.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-sm font-semibold">{p.currency} {p.amount.toFixed(2)}</span>
                          <Badge variant={vs[p.status as keyof typeof vs] ?? 'neutral'}>{p.status}</Badge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {canPayment && !isClosed && (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lz-muted">Registrar pago</p>
                  <PaymentForm orderId={id} pendingAmount={pendingAmount} currency={sale.currency_code} />
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
            <CardHeader><p className="text-sm font-semibold text-lz-text">Historial</p></CardHeader>
            <CardBody>
              {(sale.order_status_history ?? []).length === 0 ? (
                <p className="text-sm text-lz-muted">Sin historial.</p>
              ) : (
                <ol className="relative space-y-0 pl-6">
                  <div className="absolute left-2.5 top-0 h-full w-px bg-lz-border/60" aria-hidden="true" />
                  {[...(sale.order_status_history ?? [])]
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                    .map((h) => {
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
