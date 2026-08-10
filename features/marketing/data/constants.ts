export const CAMPAIGN_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  email:       { label: 'Email',        color: '#3b82f6' },
  whatsapp:    { label: 'WhatsApp',     color: '#10b981' },
  discount:    { label: 'Descuento',    color: '#f59e0b' },
  launch:      { label: 'Lanzamiento',  color: '#8b5cf6' },
  remarketing: { label: 'Remarketing',  color: '#ec4899' },
}

export const CAMPAIGN_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft:     { label: 'Borrador',   variant: 'neutral'  },
  active:    { label: 'Activa',     variant: 'success'  },
  paused:    { label: 'Pausada',    variant: 'warning'  },
  completed: { label: 'Completada', variant: 'info'     },
  cancelled: { label: 'Cancelada',  variant: 'danger'   },
}

export const COUPON_TYPE_LABELS: Record<string, string> = {
  percentage: 'Porcentaje (%)',
  fixed:      'Monto fijo ($)',
}

export const AUTOMATION_DEFINITIONS = [
  {
    id:          'welcome_coupon',
    name:        'Cupón de bienvenida',
    description: 'Envía un cupón de descuento al registrar un cliente nuevo.',
    trigger:     'Nuevo cliente',
    icon:        '🎁',
  },
  {
    id:          'birthday_discount',
    name:        'Descuento por cumpleaños',
    description: 'Envía un cupón especial el mes del cumpleaños del cliente.',
    trigger:     'Mes de cumpleaños',
    icon:        '🎂',
  },
  {
    id:          'inactive_recovery',
    name:        'Recuperación de inactivos',
    description: 'Contacta clientes sin compras en los últimos 90 días.',
    trigger:     '90 días sin compra',
    icon:        '🔄',
  },
  {
    id:          'purchase_thanks',
    name:        'Agradecimiento por compra',
    description: 'Mensaje de gracias después de cada pedido entregado.',
    trigger:     'Pedido entregado',
    icon:        '✅',
  },
  {
    id:          'vip_promotion',
    name:        'Promociones VIP',
    description: 'Acceso anticipado a promociones para clientes con etiqueta VIP.',
    trigger:     'Cliente VIP',
    icon:        '⭐',
  },
]

export const CAMPAIGN_TYPE_OPTIONS = Object.entries(CAMPAIGN_TYPE_LABELS).map(
  ([value, { label }]) => ({ value, label })
)

export const COUPON_TYPE_OPTIONS = Object.entries(COUPON_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
)
