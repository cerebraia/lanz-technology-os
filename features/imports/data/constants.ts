// Constantes puras — sin imports de servidor. Seguras para Client Components.

export const IMPORT_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'default' | 'primary' | 'muted' }> = {
  planning:           { label: 'Planificación',         variant: 'neutral'  },
  purchased:          { label: 'Comprado',              variant: 'info'     },
  in_transit:         { label: 'En tránsito',           variant: 'warning'  },
  customs:            { label: 'En aduana',             variant: 'warning'  },
  partially_received: { label: 'Recibido parcialmente', variant: 'warning'  },
  received:           { label: 'Recibido',              variant: 'success'  },
  cancelled:          { label: 'Cancelado',             variant: 'danger'   },
}

export const RECEIPT_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'default' | 'primary' | 'muted' }> = {
  draft:     { label: 'Borrador',   variant: 'neutral' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  cancelled: { label: 'Cancelada',  variant: 'danger'  },
}

export const SHIPPING_METHOD_LABELS: Record<string, string> = {
  air:     'Aéreo',
  sea:     'Marítimo',
  land:    'Terrestre',
  courier: 'Courier',
}

export const EXPENSE_CONCEPT_LABELS: Record<string, string> = {
  freight:   'Flete',
  insurance: 'Seguro',
  customs:   'Aduana',
  taxes:     'Impuestos',
  storage:   'Almacenaje',
  transport: 'Transporte',
  other:     'Otro',
}

export type ImportStatus =
  | 'planning'
  | 'purchased'
  | 'in_transit'
  | 'customs'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export const IMPORT_STATUS_STAGES: ImportStatus[] = [
  'planning', 'purchased', 'in_transit', 'customs', 'received',
]

// ─── Cost allocation labels ───────────────────────────────────────────────────

export const ALLOCATION_METHOD_LABELS: Record<string, string> = {
  quantity: 'Por cantidad de unidades',
  value:    'Por valor de mercancía',
  manual:   'Distribución manual',
}

// ─── Receipt item derived values (pure, no server imports) ───────────────────

export type ReceiptItemLike = {
  expected_quantity:            number
  previously_received_quantity: number
  received_quantity:            number
  damaged_quantity:             number
}

export function getItemDerived(item: ReceiptItemLike) {
  const pending  = item.expected_quantity - item.previously_received_quantity
  const accepted = item.received_quantity - item.damaged_quantity
  const missing  = Math.max(pending - item.received_quantity, 0)
  const excess   = Math.max(item.received_quantity - pending, 0)
  return { pending, accepted, missing, excess }
}
