'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { confirmImportReceiptAction, cancelImportReceiptAction } from '@/features/imports/actions/receipt-actions'

type Props = {
  receiptId:   string
  importId:    string
  hasReceived: boolean
  canConfirm:  boolean
  canCancel:   boolean
}

export function ReceiptConfirmButton({ receiptId, importId, hasReceived, canConfirm, canCancel }: Props) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  async function handleConfirm() {
    if (!confirm(
      'Esta recepción generará movimientos de inventario y no podrá editarse después.\n\n¿Confirmar la recepción?'
    )) return

    start(async () => {
      setError(null)
      const result = await confirmImportReceiptAction(receiptId, importId)
      if (result.error) setError(result.error)
    })
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar esta recepción? Esta acción no puede deshacerse.')) return
    start(async () => {
      setError(null)
      const result = await cancelImportReceiptAction(receiptId, importId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex items-center gap-2">
        {canConfirm && (
          <Button
            size="sm"
            loading={pending}
            disabled={!hasReceived}
            onClick={handleConfirm}
          >
            Confirmar recepción
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="danger" loading={pending} onClick={handleCancel}>
            Cancelar
          </Button>
        )}
      </div>
      {canConfirm && !hasReceived && (
        <p className="text-xs text-lz-muted">
          Registra al menos una unidad recibida antes de confirmar.
        </p>
      )}
    </div>
  )
}
