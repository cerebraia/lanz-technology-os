export type RiskLevel = 'normal' | 'attention' | 'critical'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

export const PRIORITY_LABELS: Record<AlertPriority, { label: string; variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  low:      { label: 'Baja',     variant: 'neutral'  },
  medium:   { label: 'Media',    variant: 'info'     },
  high:     { label: 'Alta',     variant: 'warning'  },
  critical: { label: 'Crítica',  variant: 'danger'   },
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  normal:    'text-lz-success',
  attention: 'text-lz-warning',
  critical:  'text-lz-danger',
}

export const RISK_BG: Record<RiskLevel, string> = {
  normal:    'bg-lz-success',
  attention: 'bg-lz-warning',
  critical:  'bg-lz-danger',
}

export const INSIGHT_TYPE_LABELS: Record<string, string> = {
  inventory: 'Inventario',
  finance:   'Finanzas',
  sales:     'Ventas',
  import:    'Importaciones',
  marketing: 'Marketing',
  general:   'General',
}

// Pre-built assistant questions with their query keys
export const ASSISTANT_QUESTIONS = [
  { id: 'top_product',      label: '¿Cuál fue el producto más vendido este mes?' },
  { id: 'import_needed',    label: '¿Qué productos debo importar?' },
  { id: 'cash_invested',    label: '¿Cuánto dinero tengo invertido en inventario?' },
  { id: 'current_margin',   label: '¿Cuál es mi margen actual?' },
  { id: 'top_customers',    label: '¿Qué clientes generan más ingresos?' },
  { id: 'low_stock',        label: '¿Qué productos tienen bajo stock?' },
  { id: 'monthly_revenue',  label: '¿Cuánto vendí este mes?' },
  { id: 'pending_payables', label: '¿Cuánto debo a proveedores?' },
  { id: 'active_imports',   label: '¿Qué importaciones están en tránsito?' },
  { id: 'inactive_customers', label: '¿Qué clientes no han comprado en 90 días?' },
]
