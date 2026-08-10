import { IconCircleCheck, IconCircleDot } from '@/components/icons'

export type TimelineItem = {
  label:    string
  date?:    string | null
  sublabel?: string
  status:   'done' | 'current' | 'pending'
}

type TimelineProps = {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <li key={item.label} className="relative flex gap-4">
            {/* Connector line */}
            {!isLast && (
              <div
                aria-hidden="true"
                className={[
                  'absolute left-[11px] top-6 w-px',
                  item.status === 'done' ? 'bg-lz-success/60 h-full' : 'bg-lz-border h-full',
                ].join(' ')}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
              {item.status === 'done' && (
                <IconCircleCheck size={22} className="text-lz-success" />
              )}
              {item.status === 'current' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-lz-primary bg-lz-primary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-lz-primary" />
                </span>
              )}
              {item.status === 'pending' && (
                <IconCircleDot size={22} className="text-lz-border" />
              )}
            </div>

            {/* Content */}
            <div className={['pb-6', isLast ? 'pb-0' : ''].join(' ')}>
              <p
                className={[
                  'text-sm font-medium',
                  item.status === 'done'    ? 'text-lz-success' :
                  item.status === 'current' ? 'text-lz-text'    :
                  'text-lz-muted',
                ].join(' ')}
              >
                {item.label}
              </p>
              {item.date && (
                <p className="mt-0.5 text-xs text-lz-muted">{item.date}</p>
              )}
              {item.sublabel && (
                <p className="mt-0.5 text-xs text-lz-muted/70">{item.sublabel}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
