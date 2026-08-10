'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Modal } from '@/components/ui/modal'
import {
  confirmAdjustmentAction,
  cancelAdjustmentAction,
} from '@/features/inventory/actions/adjustment-actions'

type Props = {
  adjustmentId: string
  hasChanges:   boolean
  canConfirm:   boolean
  canCancel:    boolean
}

export function AdjustmentActions({
  adjustmentId,
  hasChanges,
  canConfirm,
  canCancel,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen,  setCancelOpen]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [pending,     start]          = useTransition()

  function handleConfirm() {
    start(async () => {
      setError(null)
      const result = await confirmAdjustmentAction(adjustmentId)
      if (result.error) { setError(result.error); setConfirmOpen(false) }
      else setConfirmOpen(false)
    })
  }

  function handleCancel() {
    start(async () => {
      setError(null)
      const result = await cancelAdjustmentAction(adjustmentId)
      if (result.error) { setError(result.error); setCancelOpen(false) }
      else setCancelOpen(false)
    })
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {canConfirm && (
          <Button
            size="sm"
            disabled={!hasChanges}
            title={!hasChanges ? 'No hay diferencias que ajustar' : undefined}
            onClick={() => setConfirmOpen(true)}
          >
            Confirmar ajuste
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>
            Cancelar
          </Button>
        )}
      </div>

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar ajuste de inventario"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Volver
            </Button>
            <Button size="sm" loading={pending} onClick={handleConfirm}>
              Confirmar ajuste
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Alert variant="warning" title="Operación irreversible">
            Esta operación modificará el inventario y no podrá deshacerse.
            Si existe un error, deberá corregirse mediante un nuevo ajuste.
          </Alert>
          <p className="text-sm text-lz-muted">
            Se generarán movimientos de inventario para cada producto
            con diferencia entre el conteo físico y el sistema.
            Los productos sin diferencia serán ignorados.
          </p>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar ajuste"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button size="sm" variant="danger" loading={pending} onClick={handleCancel}>
              Cancelar ajuste
            </Button>
          </>
        }
      >
        <p className="text-sm text-lz-muted">
          El ajuste se marcará como cancelado y no afectará el inventario.
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
