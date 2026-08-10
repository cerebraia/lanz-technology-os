import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderConfirmation } from '@/features/store/actions/order-confirmation-action'
import type { OrderConfirmationData } from '@/features/store/actions/order-confirmation-action'
import { STORE_CONFIG } from '@/config/store'
import { buildOrderWhatsAppUrl } from '@/lib/whatsapp'
import { CheckoutProgress }      from '@/components/store/checkout-progress'
import { OrderHeader }           from '@/components/store/order-header'
import { OrderSummaryCard }      from '@/components/store/order-summary-card'
import { OrderStatus, isOrderCancelled } from '@/components/store/order-status'
import { OrderTimeline }         from '@/components/store/order-timeline'
import { ConfirmationActions }   from '@/components/store/confirmation-actions'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:  'Pedido registrado — Lanz Technology',
  robots: 'noindex',
}

// ─── Tipos de ruta ────────────────────────────────────────────────────────────

type Props = {
  params:       Promise<{ orderNumber: string }>
  searchParams: Promise<{ token?: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppUrlFromOrder(order: OrderConfirmationData): string | null {
  if (!STORE_CONFIG.whatsappNumber) return null

  return buildOrderWhatsAppUrl(
    {
      orderNumber:    order.order_number,
      customerName:   order.customer_name,
      items:          order.items.map(i => ({ name: i.product_name, quantity: i.quantity })),
      total:          order.total,
      currency:       order.currency,
      deliveryMethod: order.delivery_method,
      city:           order.customer_city,
      notes:          order.notes,
    },
    STORE_CONFIG.whatsappNumber,
  )
}

function reservationExpiry(createdAt: string): string {
  const d = new Date(createdAt)
  d.setHours(d.getHours() + STORE_CONFIG.reservationHours)
  return d.toLocaleString('es-VE', {
    day:      'numeric',
    month:    'long',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: STORE_CONFIG.timezone,
  })
}

// ─── Aviso de reserva ─────────────────────────────────────────────────────────

function ReservationNotice({ createdAt }: { createdAt: string }) {
  const expiresLabel = reservationExpiry(createdAt)
  return (
    <div className="flex gap-3 rounded-2xl border border-lz-warning/30 bg-lz-warning/8 px-5 py-4">
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-lz-warning"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-xs font-semibold text-lz-text">
          Reserva vigente por {STORE_CONFIG.reservationHours} horas
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-lz-muted">
          Tu inventario está reservado hasta el{' '}
          <strong className="text-lz-text">{expiresLabel}</strong>.
          Coordina el pago a la brevedad para confirmar tu pedido.
        </p>
      </div>
    </div>
  )
}

// ─── Vista de pedido cancelado ─────────────────────────────────────────────────

function CancelledOrderView({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="animate-page mx-auto max-w-xl px-4 py-20 sm:px-6 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lz-danger/15">
          <svg className="h-7 w-7 text-lz-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-lz-text">Pedido cancelado</h1>
      <p className="mt-3 text-sm text-lz-muted">
        El pedido <strong className="text-lz-text">{orderNumber}</strong> fue cancelado y la reserva de inventario liberada.
      </p>
      <p className="mt-2 text-sm text-lz-muted">
        Si crees que esto es un error, comunícate con nosotros.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/catalog"
          className="flex h-11 items-center justify-center rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  )
}

// ─── Vista principal de confirmación ──────────────────────────────────────────

function OrderConfirmationView({
  order,
  whatsAppUrl,
}: {
  order:       OrderConfirmationData
  whatsAppUrl: string | null
}) {
  return (
    <>
      {/* Botón fijo inferior — solo mobile */}
      <ConfirmationActions
        whatsAppUrl={whatsAppUrl}
        orderNumber={order.order_number}
        mobileFixed
      />

      <div className="animate-page mx-auto max-w-7xl px-4 pb-28 pt-12 sm:px-6 lg:pb-12 lg:px-8">
        {/* Breadcrumb progress */}
        <div className="mb-8 space-y-6">
          <CheckoutProgress current="confirmation" />
          <OrderHeader orderNumber={order.order_number} createdAt={order.created_at} />
        </div>

        {/* Layout: 2 columnas desktop, 1 columna mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* ── Columna izquierda: resumen del pedido ───────────────────── */}
          <div className="space-y-5 lg:col-span-3">
            {/* Estado del pedido */}
            <OrderStatus
              status={order.status}
              paymentStatus={order.payment_status}
            />

            {/* Productos + totales + datos del cliente */}
            <OrderSummaryCard order={order} />

            {/* Timeline de próximos pasos — visible solo en mobile */}
            <div className="lg:hidden">
              <OrderTimeline />
            </div>
          </div>

          {/* ── Columna derecha: acciones (sticky en desktop) ───────────── */}
          <div className="lg:col-span-2">
            <div className="space-y-5 lg:sticky lg:top-24">

              {/* Acciones (botones) — ocultos en mobile, visible en desktop */}
              <div className="hidden lg:block">
                <ConfirmationActions
                  whatsAppUrl={whatsAppUrl}
                  orderNumber={order.order_number}
                />
              </div>

              {/* Aviso de reserva */}
              <ReservationNotice createdAt={order.created_at} />

              {/* Timeline — visible solo en desktop */}
              <div className="hidden lg:block">
                <OrderTimeline />
              </div>

              {/* Botón catálogo — visible en mobile (el WhatsApp va fijo abajo) */}
              <div className="lg:hidden">
                <Link
                  href="/catalog"
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-lz-border text-sm text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
                >
                  Seguir comprando
                </Link>
              </div>

              {/* Nota de referencia */}
              <p className="text-center text-[10px] leading-relaxed text-lz-muted/60">
                Guarda tu número de pedido:{' '}
                <strong className="text-lz-muted">{order.order_number}</strong>.
                No se requiere cuenta para consultar el estado con nuestro equipo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params
  const { token }       = await searchParams

  // Token requerido — sin él no hay forma segura de verificar el pedido
  if (!token) notFound()

  const order = await getOrderConfirmation(orderNumber, token)

  // Pedido no encontrado o token inválido
  if (!order) notFound()

  // Pedido cancelado → vista especial
  if (isOrderCancelled(order.status)) {
    return <CancelledOrderView orderNumber={order.order_number} />
  }

  const whatsAppUrl = buildWhatsAppUrlFromOrder(order)

  return <OrderConfirmationView order={order} whatsAppUrl={whatsAppUrl} />
}
