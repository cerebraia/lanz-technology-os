type StatusConfig = {
  label:   string
  color:   string
  bgColor: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending_confirmation: { label: 'Pendiente de confirmación', color: 'text-lz-warning',  bgColor: 'bg-lz-warning/10'  },
  pending:              { label: 'Pendiente',                  color: 'text-lz-warning',  bgColor: 'bg-lz-warning/10'  },
  confirmed:            { label: 'Confirmado',                 color: 'text-lz-success',  bgColor: 'bg-lz-success/10'  },
  preparing:            { label: 'En preparación',             color: 'text-lz-info',     bgColor: 'bg-lz-info/10'     },
  ready:                { label: 'Listo para entrega',         color: 'text-lz-success',  bgColor: 'bg-lz-success/10'  },
  delivered:            { label: 'Entregado',                  color: 'text-lz-success',  bgColor: 'bg-lz-success/10'  },
  cancelled:            { label: 'Cancelado',                  color: 'text-lz-danger',   bgColor: 'bg-lz-danger/10'   },
  refunded:             { label: 'Reembolsado',                color: 'text-lz-muted',    bgColor: 'bg-lz-border/40'   },
}

const PAYMENT_MAP: Record<string, StatusConfig> = {
  pending:  { label: 'Pago pendiente', color: 'text-lz-warning', bgColor: 'bg-lz-warning/10' },
  partial:  { label: 'Pago parcial',   color: 'text-lz-info',    bgColor: 'bg-lz-info/10'    },
  paid:     { label: 'Pagado',         color: 'text-lz-success', bgColor: 'bg-lz-success/10' },
  refunded: { label: 'Reembolsado',    color: 'text-lz-muted',   bgColor: 'bg-lz-border/40'  },
}

function StatusBadge({ config }: { config: StatusConfig }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        config.color,
        config.bgColor,
      ].join(' ')}
    >
      {config.label}
    </span>
  )
}

type Props = {
  status:        string
  paymentStatus: string
}

export function OrderStatus({ status, paymentStatus }: Props) {
  const orderConfig   = STATUS_MAP[status]   ?? { label: status,        color: 'text-lz-muted', bgColor: 'bg-lz-border/40' }
  const paymentConfig = PAYMENT_MAP[paymentStatus] ?? { label: paymentStatus, color: 'text-lz-muted', bgColor: 'bg-lz-border/40' }

  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge config={orderConfig}   />
      <StatusBadge config={paymentConfig} />
    </div>
  )
}

/** Retorna true si el pedido está cancelado */
export function isOrderCancelled(status: string): boolean {
  return status === 'cancelled'
}
