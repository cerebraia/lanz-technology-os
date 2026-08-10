type Props = { value: number; size?: 'sm' | 'md' }

export function ConfidenceBar({ value, size = 'sm' }: Props) {
  const pct  = Math.round(value * 100)
  const color = pct >= 90 ? 'bg-lz-danger'   // urgent
              : pct >= 70 ? 'bg-lz-warning'
              : 'bg-lz-success'
  const h = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex items-center gap-2">
      <div className={['w-16 overflow-hidden rounded-full bg-lz-border', h].join(' ')}>
        <div className={['h-full rounded-full transition-all', color].join(' ')} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-lz-muted">{pct}%</span>
    </div>
  )
}
