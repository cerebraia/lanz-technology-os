import { Badge } from '@/components/ui/badge'
import { PRIORITY_LABELS, INSIGHT_TYPE_LABELS, type AlertPriority } from '@/features/ai/data/constants'
import type { SmartAlert } from '@/features/ai/data/smart-alerts'

const TYPE_ICONS: Record<string, string> = {
  inventory: '📦',
  finance:   '💰',
  sales:     '🛒',
  import:    '🚢',
  marketing: '📣',
  general:   'ℹ️',
}

export function AlertCard({ alert }: { alert: SmartAlert }) {
  const p = PRIORITY_LABELS[alert.priority as AlertPriority]
  return (
    <div className={[
      'rounded-xl border p-4 transition-colors',
      alert.priority === 'critical' ? 'border-lz-danger/40 bg-lz-danger/5' :
      alert.priority === 'high'     ? 'border-lz-warning/40 bg-lz-warning/5' :
      'border-lz-border bg-lz-surface',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{TYPE_ICONS[alert.type] ?? 'ℹ️'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-lz-text">{alert.title}</p>
            <Badge variant={p?.variant ?? 'neutral'}>{p?.label ?? alert.priority}</Badge>
            <span className="text-[11px] text-lz-muted">{INSIGHT_TYPE_LABELS[alert.type] ?? alert.type}</span>
          </div>
          <p className="mt-1 text-xs text-lz-muted">{alert.description}</p>
        </div>
      </div>
    </div>
  )
}
