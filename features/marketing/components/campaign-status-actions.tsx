'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { updateCampaignStatusAction } from '@/features/marketing/actions/marketing-actions'

const NEXT_STATES: Record<string, { label: string; next: 'active' | 'paused' | 'completed' | 'cancelled'; variant: 'primary' | 'secondary' | 'ghost' }[]> = {
  draft:     [{ label: 'Activar',   next: 'active',    variant: 'primary'   }, { label: 'Cancelar',  next: 'cancelled', variant: 'ghost' }],
  active:    [{ label: 'Pausar',    next: 'paused',    variant: 'secondary' }, { label: 'Completar', next: 'completed', variant: 'secondary' }],
  paused:    [{ label: 'Reactivar', next: 'active',    variant: 'primary'   }, { label: 'Cancelar',  next: 'cancelled', variant: 'ghost' }],
}

type Props = { campaignId: string; status: string; canUpdate: boolean }

export function CampaignStatusActions({ campaignId, status, canUpdate }: Props) {
  const [error,   setError] = useState<string | null>(null)
  const [pending, start]    = useTransition()

  if (!canUpdate) return null
  const transitions = NEXT_STATES[status]
  if (!transitions) return null

  async function handle(next: 'active' | 'paused' | 'completed' | 'cancelled') {
    start(async () => {
      setError(null)
      const result = await updateCampaignStatusAction(campaignId, next)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <Alert variant="danger">{error}</Alert>}
      {transitions.map(({ label, next, variant }) => (
        <Button key={next} size="sm" variant={variant} loading={pending} onClick={() => handle(next)}>
          {label}
        </Button>
      ))}
    </div>
  )
}
