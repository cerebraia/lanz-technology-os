type EmptyStateProps = {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-lz-border bg-lz-surface/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lz-border">
        {icon ?? <span className="text-xl text-lz-muted">○</span>}
      </div>
      <p className="text-sm font-medium text-lz-text">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-lz-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
