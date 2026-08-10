import type { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'elevated' | 'interactive'

const variantClasses: Record<CardVariant, string> = {
  default:     'border-lz-border bg-lz-surface',
  elevated:    'border-lz-border bg-lz-surface shadow-lg shadow-black/40',
  interactive: 'border-lz-border bg-lz-surface cursor-pointer transition-colors hover:border-lz-primary/50 hover:bg-lz-primary/5',
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: boolean
  variant?: CardVariant
}

export function Card({ children, className = '', padding = true, variant = 'default', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        'rounded-xl border',
        variantClasses[variant],
        padding ? 'p-5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

type SlotProps = HTMLAttributes<HTMLDivElement>

export function CardHeader({ children, className = '', ...props }: SlotProps) {
  return (
    <div
      {...props}
      className={['flex items-center justify-between border-b border-lz-border px-5 py-4', className].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }: SlotProps) {
  return (
    <div {...props} className={['p-5', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }: SlotProps) {
  return (
    <div
      {...props}
      className={['border-t border-lz-border px-5 py-4', className].join(' ')}
    >
      {children}
    </div>
  )
}
