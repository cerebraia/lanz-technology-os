'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { updateOrderStatusAction } from '@/features/orders/actions/order-actions'

const TRANSITIONS: Record<string, { label: string; next: string; variant: 'primary' | 'secondary' | 'ghost' }[]> = {
  draft:       [{ label: 'Confirmar pedido', next: 'pending',    variant: 'primary'   }],
  pending:     [{ label: 'Marcar pagado',    next: 'paid',       variant: 'primary'   }, { label: 'En proceso', next: 'processing', variant: 'secondary' }],
  paid:        [{ label: 'En proceso',       next: 'processing', variant: 'primary'   }],
  processing:  [{ label: 'Marcar enviado',   next: 'shipped',    variant: 'primary'   }],
  shipped:     [{ label: 'Marcar entregado', next: 'delivered',  variant: 'primary'   }],
}
const CANCELLABLE = ['draft', 'pending', 'paid', 'processing', 'pending_confirmation', 'confirmed', 'preparing']

type Props = {
  orderId:     string
  status:      string
  canUpdate:   boolean
  canCancel:   boolean
  canShip:     boolean
}

export function OrderStatusActions({ orderId, status, canUpdate, canCancel, canShip }: Props) {
  const [error,   setError] = useState<string | null>(null)
  const [pending, start]    = useTransition()

  async function handle(next: string) {
    start(async () => {
      setError(null)
      const result = await updateOrderStatusAction(orderId, next)
      if (result.error) setError(result.error)
    })
  }

  const transitions = TRANSITIONS[status] ?? []
  const showCancel  = canCancel && CANCELLABLE.includes(status)

  if (transitions.length === 0 && !showCancel) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      {transitions.map(({ label, next, variant }) => {
        if (next === 'shipped' && !canShip) return null
        if (!canUpdate && next !== 'shipped') return null
        return (
          <Button key={next} size="sm" variant={variant} loading={pending} onClick={() => handle(next)}>
            {label}
          </Button>
        )
      })}
      {showCancel && (
        <Button size="sm" variant="ghost" loading={pending} onClick={() => handle('cancelled')}>
          Cancelar pedido
        </Button>
      )}
    </div>
  )
}
