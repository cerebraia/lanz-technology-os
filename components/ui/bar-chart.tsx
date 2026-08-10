'use client'

type BarColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted'

export type BarData = {
  label:  string
  value:  number
  color?: BarColor
}

const COLOR_CLASSES: Record<BarColor, string> = {
  primary: 'bg-lz-primary',
  success: 'bg-lz-success',
  danger:  'bg-lz-danger',
  warning: 'bg-lz-warning',
  info:    'bg-lz-info',
  muted:   'bg-lz-border',
}

type BarChartProps = {
  data:         BarData[]
  maxHeight?:   number
  formatValue?: (v: number) => string
  className?:   string
}

export function BarChart({ data, maxHeight = 120, formatValue, className = '' }: BarChartProps) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1)
  const barH = maxHeight - 20

  return (
    <div className={['flex items-end gap-1', className].join(' ')} style={{ height: maxHeight }}>
      {data.map((d) => {
        const pct   = (Math.abs(d.value) / max) * 100
        const color = COLOR_CLASSES[d.color ?? 'primary']
        return (
          <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-1">
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-lz-border bg-lz-surface px-2 py-0.5 text-[10px] text-lz-text opacity-0 shadow transition-opacity group-hover:opacity-100">
              {formatValue ? formatValue(d.value) : String(d.value)}
            </div>

            <div className="flex w-full flex-col justify-end" style={{ height: barH }}>
              <div
                className={['w-full rounded-t transition-all', color].join(' ')}
                style={{ height: `${pct}%`, minHeight: pct > 0 ? 2 : 0 }}
              />
            </div>

            <span className="w-full truncate text-center text-[10px] text-lz-muted">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
