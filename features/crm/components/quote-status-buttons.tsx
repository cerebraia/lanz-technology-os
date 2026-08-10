'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { updateQuoteStatusAction } from '@/features/crm/actions/crm-actions'

type Props = { quoteId: string; currentStatus: string; canUpdate: boolean }

export function QuoteStatusButtons({ quoteId, currentStatus, canUpdate }: Props) {
  const [error, setError]   = useState<string | null>(null)
  const [pending, start]    = useTransition()

  if (!canUpdate || ['accepted', 'rejected', 'expired'].includes(currentStatus)) return null

  async function handle(status: 'sent' | 'accepted' | 'rejected' | 'expired') {
    start(async () => {
      setError(null)
      const result = await updateQuoteStatusAction(quoteId, status)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      {currentStatus === 'draft' && (
        <Button size="sm" variant="secondary" loading={pending} onClick={() => handle('sent')}>
          Marcar enviada
        </Button>
      )}
      {['draft', 'sent'].includes(currentStatus) && (
        <>
          <Button size="sm" variant="secondary" loading={pending} onClick={() => handle('accepted')}>
            Aceptada
          </Button>
          <Button size="sm" variant="ghost" loading={pending} onClick={() => handle('rejected')}>
            Rechazada
          </Button>
          <Button size="sm" variant="ghost" loading={pending} onClick={() => handle('expired')}>
            Expirada
          </Button>
        </>
      )}
    </div>
  )
}
