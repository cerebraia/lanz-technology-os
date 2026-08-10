'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { IconSend } from '@/components/icons'
import {
  sendPurchaseOrderAction,
  cancelPurchaseOrderAction,
} from '@/features/purchases/actions/purchase-actions'

type Props = {
  orderId:    string
  totalItems: number
  status:     string
  canSend:    boolean
  canCancel:  boolean
}

export function PurchaseStatusActions({ orderId, totalItems, status, canSend, canCancel }: Props) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  async function handleSend() {
    start(async () => {
      setError(null)
      const result = await sendPurchaseOrderAction(orderId)
      if (result.error) setError(result.error)
    })
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar esta orden de compra?')) return
    start(async () => {
      setError(null)
      const result = await cancelPurchaseOrderAction(orderId)
      if (result.error) setError(result.error)
    })
  }

  const isDraft      = status === 'draft'
  const isCancellable = !['completed', 'cancelled'].includes(status)

  return (
    <div className="space-y-3">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex items-center gap-2">
        {isDraft && canSend && (
          <Button
            size="sm"
            loading={pending}
            disabled={totalItems === 0}
            onClick={handleSend}
          >
            <IconSend size={14} />
            Enviar orden
          </Button>
        )}

        {isCancellable && canCancel && (
          <Button
            size="sm"
            variant="danger"
            loading={pending}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        )}
      </div>

      {isDraft && totalItems === 0 && (
        <p className="text-xs text-lz-muted">
          Agrega al menos un producto para poder enviar la orden.
        </p>
      )}
    </div>
  )
}
