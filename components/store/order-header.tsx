import { STORE_CONFIG } from '@/config/store'

type Props = {
  orderNumber: string
  createdAt:   string
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('es-VE', {
    day:      'numeric',
    month:    'long',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: STORE_CONFIG.timezone,
  })
}

export function OrderHeader({ orderNumber, createdAt }: Props) {
  return (
    <div className="space-y-5">
      {/* Indicador de éxito */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lz-success/15"
          aria-hidden="true"
        >
          <svg
            className="h-6 w-6 text-lz-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-lz-text sm:text-3xl">
            Tu pedido fue registrado correctamente
          </h1>
          <p className="mt-1 text-sm text-lz-muted">
            Uno de nuestros asesores confirmará disponibilidad, pago y entrega.
          </p>
        </div>
      </div>

      {/* Badge de número de pedido */}
      <div className="flex items-center justify-between rounded-2xl border border-lz-primary/30 bg-lz-primary/8 px-6 py-4">
        <div>
          <p className="text-xs font-medium text-lz-muted">Número de pedido</p>
          <p className="mt-0.5 text-2xl font-bold tracking-wide text-lz-primary">
            {orderNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-lz-muted">Registrado el</p>
          <p className="mt-0.5 text-xs font-medium text-lz-text">{formatDate(createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
