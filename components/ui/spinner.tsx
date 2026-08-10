type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-3.5 w-3.5 border-[1.5px]',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-2',
}

type SpinnerProps = {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={[
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className,
      ].join(' ')}
    />
  )
}
