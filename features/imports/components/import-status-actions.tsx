'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { changeImportStatusAction } from '@/features/imports/actions/import-actions'
import type { ImportStatus } from '@/features/imports/data/constants'

const NEXT_STATUS_LABEL: Partial<Record<string, string>> = {
  planning:   'Marcar como comprado',
  purchased:  'Marcar en tránsito',
  in_transit: 'Marcar en aduana',
  customs:    'Marcar como recibido',
}

const NEXT_STATUS_MAP: Partial<Record<string, ImportStatus>> = {
  planning:   'purchased',
  purchased:  'in_transit',
  in_transit: 'customs',
  customs:    'received',
}

type Props = {
  importId:   string
  status:     string
  canUpdate:  boolean
  canReceive: boolean
}

export function ImportStatusActions({ importId, status, canUpdate, canReceive }: Props) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  const nextStatus = NEXT_STATUS_MAP[status]
  const nextLabel  = NEXT_STATUS_LABEL[status]

  const canAdvance =
    nextStatus &&
    (nextStatus === 'received' ? canReceive : canUpdate)

  const canCancel = canUpdate && !['received', 'cancelled'].includes(status)

  async function handleAdvance() {
    if (!nextStatus) return
    start(async () => {
      setError(null)
      const result = await changeImportStatusAction(importId, nextStatus)
      if (result.error) setError(result.error)
    })
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar esta importación?')) return
    start(async () => {
      setError(null)
      const result = await changeImportStatusAction(importId, 'cancelled')
      if (result.error) setError(result.error)
    })
  }

  if (!canAdvance && !canCancel) return null

  return (
    <div className="space-y-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex items-center gap-2">
        {canAdvance && nextLabel && (
          <Button size="sm" loading={pending} onClick={handleAdvance}>
            {nextLabel}
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="danger" loading={pending} onClick={handleCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
