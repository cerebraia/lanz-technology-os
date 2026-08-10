'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { updateOrderStatusAction } from '@/features/orders/actions/order-actions'

// Sales-specific status transitions
const TRANSITIONS: Record<string, { label: string; next: string; variant: 'primary' | 'secondary' }[]> = {
  draft:       [{ label: 'Confirmar venta',      next: 'confirmed',  variant: 'primary'   }],
  pending:     [{ label: 'Confirmar venta',       next: 'confirmed',  variant: 'primary'   }],
  confirmed:   [{ label: 'En preparación',        next: 'preparing',  variant: 'primary'   },
                { label: 'Marcar enviada',         next: 'shipped',    variant: 'secondary' }],
  preparing:   [{ label: 'Marcar enviada',         next: 'shipped',    variant: 'primary'   }],
  shipped:     [{ label: 'Marcar entregada',       next: 'delivered',  variant: 'primary'   }],
  processing:  [{ label: 'Marcar enviada',         next: 'shipped',    variant: 'primary'   }],
  paid:        [{ label: 'En proceso',             next: 'processing', variant: 'primary'   }],
}

type Props = {
  orderId:   string
  status:    string
  canUpdate: boolean
  canShip:   boolean
}

export function SaleStatusActions({ orderId, status, canUpdate, canShip }: Props) {
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
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      {transitions.map(({ label, next, variant }) => {
        if (next === 'shipped' && !canShip)   return null
        if (!canUpdate && next !== 'shipped')  return null
        return (
          <Button key={next} size="sm" variant={variant} loading={pending} onClick={() => handle(next)}>
            {label}
          </Button>
        )
      })}
    </div>
  )
}
