import type { CustomerActivity } from '@/features/crm/data/activity'
import { ACTIVITY_TYPE_LABELS } from '@/features/crm/data/constants'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const TYPE_DOT: Record<string, string> = {
  purchase: 'bg-lz-success',
  message:  'bg-lz-info',
  call:     'bg-lz-accent',
  support:  'bg-lz-warning',
  note:     'bg-lz-border',
  quote:    'bg-lz-primary',
}

export function ActivityFeed({ items }: { items: CustomerActivity[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-lz-muted">Sin actividad registrada.</p>
  }

  return (
    <ol className="relative space-y-0 pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-0 h-full w-px bg-lz-border/60" aria-hidden="true" />

      {items.map((item) => (
        <li key={item.id} className="relative pb-5 last:pb-0">
          {/* Dot */}
          <span
            className={[
              'absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full border-2 border-lz-bg',
              TYPE_DOT[item.activity_type] ?? 'bg-lz-border',
            ].join(' ')}
          />
          <div>
            <p className="text-xs font-semibold text-lz-muted uppercase tracking-wide">
              {ACTIVITY_TYPE_LABELS[item.activity_type] ?? item.activity_type}
            </p>
            <p className="mt-0.5 text-sm text-lz-text">{item.description}</p>
            <p className="mt-0.5 text-[11px] text-lz-muted">{fmt(item.created_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
