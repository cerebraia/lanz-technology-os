type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'muted' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-lz-primary/20 text-lz-accent border border-lz-primary/30',
  primary: 'bg-lz-primary text-white',
  success: 'bg-lz-success/15 text-lz-success border border-lz-success/25',
  warning: 'bg-lz-warning/15 text-lz-warning border border-lz-warning/25',
  danger:  'bg-lz-danger/15 text-lz-danger border border-lz-danger/25',
  neutral: 'bg-lz-border/80 text-lz-muted border border-lz-border',
  muted:   'bg-lz-border text-lz-muted border border-lz-border',
  info:    'bg-lz-info/15 text-lz-info border border-lz-info/25',
}

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
