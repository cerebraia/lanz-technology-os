'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { toggleSupplierStatusAction } from '@/features/suppliers/actions/supplier-actions'

type Props = {
  supplierId: string
  isActive:   boolean
  canDisable: boolean
}

export function SupplierToggle({ supplierId, isActive, canDisable }: Props) {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, start]      = useTransition()

  if (!canDisable) return null

  async function handleToggle() {
    const label = isActive ? 'desactivar' : 'activar'
    if (!confirm(`¿Deseas ${label} este proveedor?`)) return

    start(async () => {
      setError(null)
      const result = await toggleSupplierStatusAction(supplierId, !isActive)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="danger">{error}</Alert>}
      <Button
        size="sm"
        variant={isActive ? 'danger' : 'secondary'}
        loading={pending}
        onClick={handleToggle}
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  )
}
