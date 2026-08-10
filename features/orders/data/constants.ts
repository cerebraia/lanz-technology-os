export type OrderStatusVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export const ORDER_STATUS_LABELS: Record<string, { label: string; variant: OrderStatusVariant }> = {
  draft:                { label: 'Borrador',       variant: 'neutral'  },
  pending:              { label: 'Pendiente',       variant: 'info'     },
  paid:                 { label: 'Pagado',          variant: 'success'  },
  processing:           { label: 'En proceso',      variant: 'info'     },
  shipped:              { label: 'Enviado',         variant: 'warning'  },
  delivered:            { label: 'Entregado',       variant: 'success'  },
  cancelled:            { label: 'Cancelado',       variant: 'danger'   },
  refunded:             { label: 'Reembolsado',     variant: 'neutral'  },
  pending_confirmation: { label: 'Por confirmar',   variant: 'info'     },
  confirmed:            { label: 'Confirmado',      variant: 'info'     },
  preparing:            { label: 'Preparando',      variant: 'warning'  },
  ready:                { label: 'Listo',           variant: 'success'  },
}

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; variant: OrderStatusVariant }> = {
  pending:   { label: 'Pendiente',  variant: 'neutral'  },
  partial:   { label: 'Parcial',    variant: 'warning'  },
  paid:      { label: 'Pagado',     variant: 'success'  },
  refunded:  { label: 'Reembolsado', variant: 'info'   },
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:           'Efectivo',
  transfer:       'Transferencia',
  mobile_payment: 'Pago móvil',
  zelle:          'Zelle',
  paypal:         'PayPal',
  binance:        'Binance',
  card:           'Tarjeta',
  other:          'Otro',
}

export const MANUAL_SALE_CHANNEL_OPTIONS = [
  { value: 'instagram',      label: 'Instagram' },
  { value: 'mercadolibre',   label: 'Mercado Libre' },
  { value: 'whatsapp',       label: 'WhatsApp' },
  { value: 'referral',       label: 'Referencia' },
  { value: 'physical_store', label: 'Tienda física' },
  { value: 'online',         label: 'Online' },
  { value: 'other',          label: 'Otro' },
]

export const MANUAL_SALE_PAYMENT_OPTIONS = [
  { value: 'cash',           label: 'Efectivo' },
  { value: 'transfer',       label: 'Transferencia' },
  { value: 'mobile_payment', label: 'Pago móvil' },
  { value: 'zelle',          label: 'Zelle' },
  { value: 'binance',        label: 'Binance' },
  { value: 'other',          label: 'Otro' },
]

export const PAYMENT_STATUS_FLOW: Record<string, { label: string; variant: OrderStatusVariant }> = {
  pending:   { label: 'Pendiente',   variant: 'neutral' },
  confirmed: { label: 'Confirmado',  variant: 'success' },
  rejected:  { label: 'Rechazado',   variant: 'danger'  },
  refunded:  { label: 'Reembolsado', variant: 'info'    },
}

export const SHIPMENT_STATUS_LABELS: Record<string, { label: string; variant: OrderStatusVariant }> = {
  pending:   { label: 'Pendiente', variant: 'neutral'  },
  shipped:   { label: 'Enviado',   variant: 'info'     },
  delivered: { label: 'Entregado', variant: 'success'  },
  returned:  { label: 'Devuelto',  variant: 'danger'   },
}

export const SALE_CHANNEL_LABELS: Record<string, string> = {
  store:          'Tienda',
  storefront:     'Tienda online',
  online:         'Online',
  whatsapp:       'WhatsApp',
  instagram:      'Instagram',
  mercadolibre:   'Mercado Libre',
  facebook:       'Facebook',
  phone:          'Teléfono',
  direct:         'Directo',
  referral:       'Referencia',
  physical_store: 'Tienda física',
  other:          'Otro',
}

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'VES', label: 'VES' },
]

export const SALE_CHANNEL_OPTIONS = Object.entries(SALE_CHANNEL_LABELS).map(
  ([value, label]) => ({ value, label })
)

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
)
