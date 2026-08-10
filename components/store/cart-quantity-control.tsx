'use client'

type Props = {
  quantity:    number
  max?:        number | null
  onIncrement: () => void
  onDecrement: () => void
  disabled?:   boolean
  size?:       'sm' | 'md'
}

export function CartQuantityControl({
  quantity, max, onIncrement, onDecrement, disabled = false, size = 'md',
}: Props) {
  const atMin   = quantity <= 1
  const atMax   = max !== null && max !== undefined && quantity >= max
  const btnSize = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'
  const numSize = size === 'sm' ? 'w-7 text-xs'     : 'w-8 text-xs'

  return (
    <div
      className="flex items-center overflow-hidden rounded-lg border border-lz-border"
      role="group"
      aria-label={`Cantidad: ${quantity}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || atMin}
        aria-label="Reducir cantidad"
        className={[
          btnSize,
          'flex items-center justify-center transition-colors',
          disabled || atMin
            ? 'cursor-not-allowed text-lz-muted/40'
            : 'text-lz-muted hover:bg-lz-border hover:text-lz-text',
        ].join(' ')}
      >
        −
      </button>

      <span
        className={`${numSize} text-center font-semibold text-lz-text tabular-nums`}
        aria-live="polite"
        aria-atomic="true"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || atMax}
        aria-label="Aumentar cantidad"
        className={[
          btnSize,
          'flex items-center justify-center transition-colors',
          disabled || atMax
            ? 'cursor-not-allowed text-lz-muted/40'
            : 'text-lz-muted hover:bg-lz-border hover:text-lz-text',
        ].join(' ')}
      >
        +
      </button>
    </div>
  )
}
