'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { saveProfitabilitySnapshotAction } from '@/features/imports/actions/cost-actions'

export function ProfitabilitySaveButton({ importId }: { importId: string }) {
  const [error,   setError]   = useState<string | null>(null)
  const [saved,   setSaved]   = useState(false)
  const [pending, start]      = useTransition()

  async function handleSave() {
    start(async () => {
      setError(null)
      setSaved(false)
      const result = await saveProfitabilitySnapshotAction(importId)
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div className="space-y-2">
      {error  && <Alert variant="danger">{error}</Alert>}
      {saved  && <Alert variant="success">Análisis guardado como snapshot histórico.</Alert>}
      <Button size="sm" variant="secondary" loading={pending} onClick={handleSave}>
        Guardar snapshot
      </Button>
    </div>
  )
}
