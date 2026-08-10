export const QUOTE_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }> = {
  draft:    { label: 'Borrador',  variant: 'neutral'  },
  sent:     { label: 'Enviada',   variant: 'info'     },
  accepted: { label: 'Aceptada', variant: 'success'  },
  rejected: { label: 'Rechazada', variant: 'danger'  },
  expired:  { label: 'Expirada', variant: 'warning'  },
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  message:  'Mensaje',
  call:     'Llamada',
  support:  'Soporte',
  note:     'Nota',
  quote:    'Cotización',
}

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  purchase: 'text-lz-success',
  message:  'text-lz-info',
  call:     'text-lz-accent',
  support:  'text-lz-warning',
  note:     'text-lz-muted',
  quote:    'text-lz-primary',
}

export const SOURCE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  tiktok:    'TikTok',
  whatsapp:  'WhatsApp',
  referral:  'Referido',
  walk_in:   'Presencial',
  other:     'Otro',
}
