import type { ReactNode } from 'react'

type Props = {
  title:     string
  subtitle?: string
  actions?:  ReactNode
  children:  ReactNode
}

export function ReportSection({ title, subtitle, actions, children }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-lz-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-lz-muted">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
