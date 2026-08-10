import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-lz-primary text-white hover:bg-lz-primary-hover focus:ring-lz-primary/50',
  secondary:
    'bg-lz-border text-lz-text hover:bg-lz-border/80 focus:ring-lz-border',
  ghost:
    'bg-transparent text-lz-muted hover:bg-lz-border hover:text-lz-text focus:ring-lz-border',
  outline:
    'border border-lz-primary/50 bg-transparent text-lz-primary hover:bg-lz-primary/10 hover:border-lz-primary focus:ring-lz-primary/50',
  danger:
    'bg-lz-danger/20 text-lz-danger hover:bg-lz-danger/30 border border-lz-danger/30 focus:ring-lz-danger/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-9 px-4 text-sm gap-2',
  lg:   'h-10 px-5 text-sm gap-2',
  icon: 'h-9 w-9 p-0',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-lz-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
