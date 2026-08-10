'use client'

import { useState, useTransition } from 'react'
import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert }    from '@/components/ui/alert'
import { Modal }    from '@/components/ui/modal'
import { cancelSaleAction } from '@/features/sales/actions/sales-actions'

type Props = {
  orderId: string
  status:  string
}

const CANCELLABLE = ['draft', 'pending', 'pending_confirmation', 'confirmed', 'processing', 'preparing', 'paid']

export function CancelSaleButton({ orderId, status }: Props) {
  const [open,    setOpen]    = useState(false)
  const [reason,  setReason]  = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  if (!CANCELLABLE.includes(status)) return null

  function handleCancel() {
    start(async () => {
      setError(null)
      const result = await cancelSaleAction(orderId, reason.trim() || 'Cancelado por operador')
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setReason('')
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Cancelar venta
      </Button>

      <Modal
        open={open}
        onClose={() => { if (!pending) { setOpen(false); setReason('') } }}
        title="Cancelar venta"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setOpen(false); setReason('') }} disabled={pending}>
              Volver
            </Button>
            <Button variant="danger" size="sm" loading={pending} onClick={handleCancel}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Textarea
            label="Motivo de cancelación"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Describe el motivo de la cancelación…"
          />
          <p className="text-xs text-lz-muted">
            Si el inventario fue descontado, será devuelto automáticamente.
          </p>
        </div>
      </Modal>
    </>
  )
}
