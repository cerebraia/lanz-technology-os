'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { executeAutomationAction } from '@/features/automations/actions/automation-actions'

type Props = { automationId: string; enabled: boolean; canExecute: boolean }

export function ExecuteButton({ automationId, enabled, canExecute }: Props) {
  const [result,  setResult]  = useState<{ success: boolean; message: string } | null>(null)
  const [pending, start]      = useTransition()

  if (!canExecute) return null

  function handleExecute() {
    setResult(null)
    start(async () => {
      const res = await executeAutomationAction(automationId)
      setResult(res)
    })
  }

  return (
    <div className="space-y-2">
      {result && (
        <Alert variant={result.success ? 'success' : 'danger'}>{result.message}</Alert>
      )}
      <Button
        size="sm"
        variant={enabled ? 'primary' : 'ghost'}
        loading={pending}
        onClick={handleExecute}
        disabled={!enabled}
      >
        {enabled ? 'Ejecutar ahora' : 'Desactivada'}
      </Button>
    </div>
  )
}
