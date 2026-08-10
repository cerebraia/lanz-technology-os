'use client'

import { useState, useTransition } from 'react'
import { toggleAutomationAction } from '@/features/automations/actions/automation-actions'

type Props = { id: string; enabled: boolean; canUpdate: boolean }

export function ToggleButton({ id, enabled, canUpdate }: Props) {
  const [active, setActive] = useState(enabled)
  const [pending, start]    = useTransition()

  if (!canUpdate) {
    return (
      <span className={['text-xs font-medium', active ? 'text-lz-success' : 'text-lz-muted'].join(' ')}>
        {active ? 'Activa' : 'Inactiva'}
      </span>
    )
  }

  function handle() {
    start(async () => {
      const next = !active
      const res  = await toggleAutomationAction(id, next)
      if (!res.error) setActive(next)
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handle}
      className={[
        'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-40',
        active
          ? 'bg-lz-success/15 text-lz-success hover:bg-lz-danger/15 hover:text-lz-danger'
          : 'bg-lz-border/80 text-lz-muted hover:bg-lz-success/15 hover:text-lz-success',
      ].join(' ')}
    >
      {pending ? '…' : active ? 'Activa' : 'Inactiva'}
    </button>
  )
}
