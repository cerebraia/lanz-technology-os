'use client'

import { useState, useTransition } from 'react'
import { Alert }  from '@/components/ui/alert'
import { deleteAllocationAction } from '@/features/imports/actions/cost-actions'

type Props = { allocationId: string; importId: string }

export function DeleteAllocationButton({ allocationId, importId }: Props) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  async function handleDelete() {
    if (!confirm('¿Eliminar esta distribución de costos? Esta acción no puede deshacerse.')) return
    start(async () => {
      setError(null)
      const result = await deleteAllocationAction(allocationId, importId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="text-xs text-lz-muted transition-colors hover:text-lz-danger disabled:opacity-40"
      >
        {pending ? '…' : 'Eliminar'}
      </button>
    </>
  )
}
