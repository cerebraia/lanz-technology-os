type Step = 'cart' | 'checkout' | 'confirmation'

type Props = { current: Step }

const STEPS: { key: Step; label: string; href?: string }[] = [
  { key: 'cart',         label: 'Carrito',      href: '/cart'     },
  { key: 'checkout',     label: 'Datos'                           },
  { key: 'confirmation', label: 'Confirmación'                    },
]

export function CheckoutProgress({ current }: Props) {
  const currentIdx = STEPS.findIndex(s => s.key === current)

  return (
    <nav aria-label="Progreso del checkout" className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx

        return (
          <div key={step.key} className="flex items-center">
            {/* Step */}
            <div className={[
              'flex items-center gap-2 text-xs font-medium transition-colors',
              active ? 'text-lz-text'    : '',
              done   ? 'text-lz-primary' : '',
              !active && !done ? 'text-lz-muted' : '',
            ].join(' ')}>
              <span className={[
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                active ? 'bg-lz-primary text-white' : '',
                done   ? 'bg-lz-primary/20 text-lz-primary' : '',
                !active && !done ? 'bg-lz-border text-lz-muted' : '',
              ].join(' ')}>
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>

            {/* Separator */}
            {i < STEPS.length - 1 && (
              <div className={[
                'mx-3 h-px w-8 sm:w-12',
                i < currentIdx ? 'bg-lz-primary/40' : 'bg-lz-border',
              ].join(' ')} aria-hidden />
            )}
          </div>
        )
      })}
    </nav>
  )
}
