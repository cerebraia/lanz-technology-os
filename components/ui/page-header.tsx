import type { ReactNode } from 'react'
import { Breadcrumb } from '@/components/ui/breadcrumb'

type BreadcrumbItem = { label: string; href?: string }

type PageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  secondaryActions?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-lz-text">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-lz-muted">{description}</p>
          )}
        </div>
        {(actions || secondaryActions) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryActions}
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
