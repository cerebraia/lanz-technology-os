import Link from 'next/link'

type AlertType = 'unavailable' | 'price_changed' | 'empty' | 'error'

type Props = {
  type:     AlertType
  message?: string
}

const CONFIG: Record<AlertType, { icon: string; title: string; color: string }> = {
  unavailable: {
    icon:  '⚠',
    title: 'Hay productos no disponibles en tu carrito',
    color: 'border-lz-danger/40 bg-lz-danger/8',
  },
  price_changed: {
    icon:  '↕',
    title: 'Algunos precios han cambiado',
    color: 'border-lz-warning/40 bg-lz-warning/8',
  },
  empty: {
    icon:  '🛒',
    title: 'Tu carrito está vacío',
    color: 'border-lz-border bg-lz-surface',
  },
  error: {
    icon:  '✕',
    title: 'Error al procesar el pedido',
    color: 'border-lz-danger/40 bg-lz-danger/8',
  },
}

export function CheckoutValidationAlert({ type, message }: Props) {
  const { icon, title, color } = CONFIG[type]

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${color}`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-lz-text">{title}</p>
        {message && <p className="text-xs text-lz-muted">{message}</p>}
        {(type === 'unavailable' || type === 'empty') && (
          <Link
            href="/cart"
            className="inline-block text-xs font-medium text-lz-primary underline-offset-2 hover:underline"
          >
            Volver al carrito
          </Link>
        )}
      </div>
    </div>
  )
}
