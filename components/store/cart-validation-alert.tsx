'use client'

import { useState } from 'react'

export type ValidationAlertType = 'price_changed' | 'unavailable' | 'rlsError'

type Props = {
  type:     ValidationAlertType
  count?:   number
  onDismiss?: () => void
}

const CONFIGS: Record<ValidationAlertType, {
  icon: string; title: string; desc: (count?: number) => string; color: string
}> = {
  price_changed: {
    icon:  '↕',
    title: 'Precios actualizados',
    desc:  (n) => `${n ?? 'Algunos'} producto${(n ?? 2) !== 1 ? 's han' : ' ha'} cambiado de precio. El carrito ya refleja los precios actuales.`,
    color: 'border-lz-warning/40 bg-lz-warning/8',
  },
  unavailable: {
    icon:  '⚠',
    title: 'Productos no disponibles',
    desc:  (n) => `${n ?? 'Algunos'} producto${(n ?? 2) !== 1 ? 's ya no están disponibles' : ' ya no está disponible'} en la tienda. Elimínalos para continuar.`,
    color: 'border-lz-danger/40 bg-lz-danger/8',
  },
  rlsError: {
    icon:  'ℹ',
    title: 'Validación no disponible',
    desc:  () => 'No se pudo verificar la disponibilidad actual. Los precios se confirmarán antes de procesar el pedido.',
    color: 'border-lz-border bg-lz-surface',
  },
}

export function CartValidationAlert({ type, count, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const { icon, title, desc, color } = CONFIGS[type]

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${color}`}
    >
      <span className="mt-0.5 shrink-0 text-sm" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-lz-text">{title}</p>
        <p className="mt-0.5 text-xs text-lz-muted leading-relaxed">{desc(count)}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar alerta"
        className="shrink-0 text-lz-muted hover:text-lz-text transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
