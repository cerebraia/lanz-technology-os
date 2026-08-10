type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

const variantClasses: Record<AlertVariant, { container: string; title: string; body: string }> = {
  info:    { container: 'bg-lz-primary/10 border-lz-primary/30', title: 'text-lz-accent',   body: 'text-lz-accent/80' },
  success: { container: 'bg-lz-success/10 border-lz-success/25', title: 'text-lz-success',  body: 'text-lz-success/80' },
  warning: { container: 'bg-lz-warning/10 border-lz-warning/25', title: 'text-lz-warning',  body: 'text-lz-warning/80' },
  danger:  { container: 'bg-lz-danger/10  border-lz-danger/25',  title: 'text-lz-danger',   body: 'text-lz-danger/80' },
}

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const s = variantClasses[variant]
  return (
    <div
      role="alert"
      className={['rounded-lg border px-4 py-3 text-sm', s.container, className].join(' ')}
    >
      {title && <p className={['mb-0.5 font-medium', s.title].join(' ')}>{title}</p>}
      <p className={s.body}>{children}</p>
    </div>
  )
}
