// Constantes puras — sin imports de servidor. Seguras para Client Components.

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash:    'Efectivo',
  bank:    'Banco',
  paypal:  'PayPal',
  zelle:   'Zelle',
  binance: 'Binance',
  other:   'Otro',
}

export const TX_TYPE_LABELS: Record<string, { label: string; variant: 'success' | 'danger' | 'info' | 'neutral' }> = {
  income:     { label: 'Ingreso',       variant: 'success' },
  expense:    { label: 'Egreso',        variant: 'danger'  },
  adjustment: { label: 'Ajuste',        variant: 'info'    },
  transfer:   { label: 'Transferencia', variant: 'neutral' },
}

export const TX_INCOME_CATEGORIES: Record<string, string> = {
  sales:    'Ventas',
  services: 'Servicios',
  other:    'Otros ingresos',
}

export const TX_EXPENSE_CATEGORIES: Record<string, string> = {
  purchases:  'Compras',
  imports:    'Importaciones',
  transport:  'Transporte',
  marketing:  'Marketing',
  payroll:    'Nómina',
  taxes:      'Impuestos',
  services:   'Servicios',
  other:      'Otros gastos',
}

export const TX_OTHER_CATEGORIES: Record<string, string> = {
  internal:   'Interno',
  correction: 'Corrección contable',
  other:      'Otro',
}

export const PAYABLE_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'danger' | 'warning' }> = {
  pending:   { label: 'Pendiente', variant: 'neutral'  },
  paid:      { label: 'Pagado',    variant: 'success'  },
  overdue:   { label: 'Vencido',   variant: 'danger'   },
  cancelled: { label: 'Cancelado', variant: 'warning'  },
}

export const RECEIVABLE_STATUS_LABELS = PAYABLE_STATUS_LABELS

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'VES', label: 'VES — Bolívar soberano' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export const PERIOD_OPTIONS = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mes' },
  { value: 'year',   label: 'Este año' },
]

export function getPeriodDates(period: string): { from: string; to: string } {
  const now  = new Date()
  const pad  = (n: number) => String(n).padStart(2, '0')
  const fmt  = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = fmt(now)

  if (period === 'today') return { from: today, to: today }

  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { from: fmt(start), to: today }
  }

  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today }
  }

  // month (default)
  return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: today }
}
