'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { updatePayableStatusAction, updateReceivableStatusAction } from '@/features/finance/actions/finance-actions'

type Mode = 'payable' | 'receivable'

export function StatusActionButtons({
  id,
  mode,
  currentStatus,
  canManage,
}: {
  id: string
  mode: Mode
  currentStatus: string
  canManage: boolean
}) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  if (!canManage || ['paid', 'cancelled'].includes(currentStatus)) return null

  async function handle(status: 'paid' | 'overdue' | 'cancelled') {
    start(async () => {
      setError(null)
      const fn = mode === 'payable' ? updatePayableStatusAction : updateReceivableStatusAction
      const result = await fn(id, status)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <Button size="sm" variant="secondary" loading={pending} onClick={() => handle('paid')}>
        Marcar pagado
      </Button>
      {currentStatus === 'pending' && (
        <Button size="sm" variant="outline" loading={pending} onClick={() => handle('overdue')}>
          Marcar vencido
        </Button>
      )}
      <Button size="sm" variant="ghost" loading={pending} onClick={() => handle('cancelled')}>
        Cancelar
      </Button>
    </div>
  )
}
