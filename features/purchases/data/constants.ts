// Constantes puras — sin imports de servidor. Seguras para Client Components.

export const PURCHASE_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'default' | 'primary' | 'muted' }> = {
  draft:              { label: 'Borrador',              variant: 'neutral'  },
  sent:               { label: 'Enviada',               variant: 'info'     },
  partially_received: { label: 'Recibida parcialmente', variant: 'warning'  },
  completed:          { label: 'Completada',            variant: 'success'  },
  cancelled:          { label: 'Cancelada',             variant: 'danger'   },
}
