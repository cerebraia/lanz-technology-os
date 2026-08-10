// Shared period helpers for all report modules.
// Kept separate so each page can import without pulling in server-only code.

export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'

export const PERIOD_OPTIONS = [
  { value: 'today',     label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'week',      label: 'Esta semana' },
  { value: 'month',     label: 'Este mes' },
  { value: 'year',      label: 'Este año' },
] as const

export function getPeriodDates(
  period: string,
  customFrom?: string,
  customTo?: string
): { from: string; to: string; label: string } {
  const now   = new Date()
  const pad   = (n: number) => String(n).padStart(2, '0')
  const fmt   = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = fmt(now)

  if (period === 'today')     return { from: today, to: today, label: 'Hoy' }

  if (period === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    const ys = fmt(y)
    return { from: ys, to: ys, label: 'Ayer' }
  }

  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return { from: fmt(start), to: today, label: 'Esta semana' }
  }

  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today, label: 'Este año' }
  }

  if (period === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo, label: `${customFrom} → ${customTo}` }
  }

  // default: month
  return {
    from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    to:   today,
    label: 'Este mes',
  }
}

export function fmtCurrency(v: number, currency = 'USD') {
  return `${currency} ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPct(v: number) {
  return `${v.toFixed(1)}%`
}
