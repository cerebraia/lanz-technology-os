import type { OrderConfirmationData } from '@/features/store/actions/order-confirmation-action'

const DELIVERY_LABELS: Record<string, string> = {
  pickup:   'Retiro acordado',
  local:    'Entrega local',
  national: 'Envío nacional',
}

type Props = {
  order: OrderConfirmationData
}

export function OrderSummaryCard({ order }: Props) {
  const delivery = order.delivery_method
    ? (DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method)
    : null

  return (
    <div className="rounded-2xl border border-lz-border bg-lz-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-lz-text">Productos</h2>

      {/* Lista de ítems */}
      <div className="space-y-0">
        {order.items.map((item, i) => (
          <div
            key={`${item.product_sku}-${i}`}
            className="flex items-start justify-between gap-4 border-b border-lz-border/50 py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-lz-text">{item.product_name}</p>
              <p className="mt-0.5 text-[10px] text-lz-muted">
                SKU: {item.product_sku}&nbsp;·&nbsp;× {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-lz-text tabular-nums">
              {item.currency} {item.line_total.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="mt-4 space-y-2 border-t border-lz-border pt-4">
        <div className="flex justify-between text-xs text-lz-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {order.currency} {order.subtotal.toFixed(2)}
          </span>
        </div>

        {delivery && (
          <div className="flex justify-between text-xs text-lz-muted">
            <span>Envío ({delivery})</span>
            <span>{order.delivery_method === 'pickup' ? 'Sin costo' : 'Por confirmar'}</span>
          </div>
        )}

        <div className="flex justify-between border-t border-lz-border pt-2 text-sm font-bold text-lz-text">
          <span>Total de productos</span>
          <span className="tabular-nums">
            {order.currency} {order.total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="mt-5 space-y-2 border-t border-lz-border pt-5">
        <h3 className="text-xs font-semibold text-lz-text">Datos de contacto</h3>
        <InfoRow label="Cliente"   value={order.customer_name} />
        {order.customer_phone && (
          <InfoRow label="Teléfono" value={order.customer_phone} />
        )}
        {order.customer_city && (
          <InfoRow label="Ciudad"   value={order.customer_city} />
        )}
        {delivery && (
          <InfoRow label="Modalidad" value={delivery} />
        )}
        {order.notes && (
          <div className="pt-1">
            <p className="text-[10px] text-lz-muted">Notas</p>
            <p className="mt-1 text-xs leading-relaxed text-lz-text">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-lz-muted">{label}</span>
      <span className="text-right font-medium text-lz-text">{value}</span>
    </div>
  )
}
