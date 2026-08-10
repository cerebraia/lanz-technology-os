type Status = 'available' | 'low' | 'out' | 'soon'

type Props = {
  inStock:  boolean
  status?:  Status
  size?:    'sm' | 'md'
}

const STATUS_CONFIG: Record<Status, { dot: string; label: string; text: string }> = {
  available: { dot: 'bg-lz-success',  label: 'Disponible',       text: 'text-lz-success' },
  low:       { dot: 'bg-lz-warning',  label: 'Pocas unidades',   text: 'text-lz-warning' },
  out:       { dot: 'bg-lz-danger',   label: 'Agotado',          text: 'text-lz-danger'  },
  soon:      { dot: 'bg-lz-muted',    label: 'Próximamente',     text: 'text-lz-muted'   },
}

export function ProductAvailability({ inStock, status, size = 'md' }: Props) {
  const resolved: Status = status ?? (inStock ? 'available' : 'out')
  const { dot, label, text } = STATUS_CONFIG[resolved]

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
      <span className={`${text} ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
        {label}
      </span>
    </div>
  )
}
