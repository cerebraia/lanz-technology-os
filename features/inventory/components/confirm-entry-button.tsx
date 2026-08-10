'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Modal } from '@/components/ui/modal'
import { confirmEntryAction, cancelEntryAction } from '@/features/inventory/actions/entry-actions'

type Props = {
  entryId:    string
  totalItems: number
  canConfirm: boolean
  canCancel:  boolean
}

export function EntryActions({ entryId, totalItems, canConfirm, canCancel }: Props) {
  const [confirmOpen,  setConfirmOpen]  = useState(false)
  const [cancelOpen,   setCancelOpen]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [pending,      start]           = useTransition()

  function handleConfirm() {
    start(async () => {
      setError(null)
      const result = await confirmEntryAction(entryId)
      if (result.error) { setError(result.error); setConfirmOpen(false) }
      else setConfirmOpen(false)
    })
  }

  function handleCancel() {
    start(async () => {
      setError(null)
      const result = await cancelEntryAction(entryId)
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
            disabled={totalItems === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Confirmar entrada
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => setCancelOpen(true)}
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar entrada"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Volver
            </Button>
            <Button size="sm" loading={pending} onClick={handleConfirm}>
              Confirmar entrada
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Alert variant="warning" title="Operación irreversible">
            Esta operación agregará inventario y no podrá deshacerse.
            Si existe un error, deberá corregirse mediante un ajuste nuevo.
          </Alert>
          <p className="text-sm text-lz-muted">
            Se generarán movimientos de stock para los{' '}
            <span className="font-medium text-lz-text">{totalItems}</span>{' '}
            {totalItems === 1 ? 'producto' : 'productos'} incluidos en esta entrada.
          </p>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar entrada"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button size="sm" variant="danger" loading={pending} onClick={handleCancel}>
              Cancelar entrada
            </Button>
          </>
        }
      >
        <p className="text-sm text-lz-muted">
          La entrada se marcará como cancelada y no afectará el inventario.
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
