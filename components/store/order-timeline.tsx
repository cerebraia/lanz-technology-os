const STEPS = [
  'Escríbenos por WhatsApp con tu número de pedido.',
  'Te confirmamos disponibilidad y el método de pago.',
  'Acordamos la entrega o envío según tu modalidad.',
  '¡Listo! Tu pedido está en camino.',
] as const

export function OrderTimeline() {
  return (
    <div className="rounded-2xl border border-lz-border bg-lz-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-lz-text">Próximos pasos</h2>
      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lz-primary/15 text-[11px] font-bold text-lz-primary"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <p className="pt-0.5 text-xs leading-relaxed text-lz-muted">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
