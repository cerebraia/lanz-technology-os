type KPI = {
  label:      string
  value:      string
  sub?:       string
  color?:     'default' | 'success' | 'danger' | 'warning' | 'muted' | 'info'
}

const colorMap = {
  default: 'text-lz-text',
  success: 'text-lz-success',
  danger:  'text-lz-danger',
  warning: 'text-lz-warning',
  muted:   'text-lz-muted',
  info:    'text-lz-info',
}

export function KpiGrid({ items, cols = 4 }: { items: KPI[]; cols?: 2 | 3 | 4 | 6 }) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[cols]

  return (
    <div className={['grid gap-3', gridClass].join(' ')}>
      {items.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-lz-border bg-lz-surface p-4">
          <p className="text-xs text-lz-muted">{kpi.label}</p>
          <p className={['mt-1.5 text-xl font-bold tabular-nums leading-tight', colorMap[kpi.color ?? 'default']].join(' ')}>
            {kpi.value}
          </p>
          {kpi.sub && <p className="mt-0.5 text-[11px] text-lz-muted">{kpi.sub}</p>}
        </div>
      ))}
    </div>
  )
}
