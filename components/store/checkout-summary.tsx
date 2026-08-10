import Image from 'next/image'
import type { CartItem } from '@/lib/store/cart'
import type { DeliveryMethod } from '@/features/store/actions/checkout-action'

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup:   'Retiro acordado',
  local:    'Entrega local',
  national: 'Envío nacional',
}

type Props = {
  items:          CartItem[]
  total:          number
  deliveryMethod: DeliveryMethod | null
  submitting:     boolean
  canSubmit:      boolean
}

export function CheckoutSummary({ items, total, deliveryMethod, submitting, canSubmit }: Props) {
  const currency = items[0]?.currency ?? 'USD'

  return (
    <div className="sticky top-24 rounded-2xl border border-lz-border bg-lz-surface p-6">
      <p className="mb-4 text-sm font-semibold text-lz-text">Tu pedido</p>

      {/* Items */}
      <div className="mb-4 max-h-56 space-y-3 overflow-y-auto border-b border-lz-border pb-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#0f0d1a]">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="48px" className="object-contain p-0.5" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg opacity-20" aria-hidden>📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-lz-text">{item.name}</p>
              <p className="text-[10px] text-lz-muted">× {item.quantity}</p>
            </div>
            <p className="shrink-0 text-xs font-semibold text-lz-text tabular-nums">
              {item.currency} {(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-b border-lz-border pb-4">
        <div className="flex justify-between text-xs text-lz-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">{currency} {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-lz-muted">
          <span>Envío</span>
          <span>{deliveryMethod === 'pickup' ? 'Sin costo' : 'Por confirmar'}</span>
        </div>
        {deliveryMethod && (
          <div className="flex justify-between text-xs text-lz-muted">
            <span>Modalidad</span>
            <span>{DELIVERY_LABELS[deliveryMethod]}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between text-sm font-bold text-lz-text">
        <span>Total estimado</span>
        <span className="tabular-nums">{currency} {total.toFixed(2)}</span>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-lz-muted">
        El precio y la disponibilidad fueron validados al iniciar el checkout y se confirmarán al registrar el pedido. El costo de envío se coordina por WhatsApp.
      </p>

      {/* Submit */}
      <button
        type="submit"
        form="checkout-form"
        disabled={!canSubmit || submitting}
        aria-disabled={!canSubmit || submitting}
        className={[
          'mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold',
          'transition-all duration-200',
          !canSubmit || submitting
            ? 'cursor-not-allowed bg-lz-border text-lz-muted'
            : 'bg-lz-primary text-white hover:bg-lz-primary-hover active:scale-[0.98]',
        ].join(' ')}
        aria-live="polite"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
            Registrando pedido…
          </>
        ) : (
          'Registrar pedido'
        )}
      </button>
    </div>
  )
}
