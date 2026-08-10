'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  publishProductAction,
  hideProductAction,
  setDraftAction,
  archiveProductAction,
} from '@/features/catalog/actions/product-actions'

type Props = {
  productId:   string
  status:      string
  isPublished: boolean
  canPublish:  boolean
  canUpdate:   boolean
  canDelete:   boolean
}

export function ProductStatusActions({
  productId,
  status,
  isPublished,
  canPublish,
  canUpdate,
  canDelete,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()

  const isArchived = status === 'archived'
  const isDraft    = status === 'draft'

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      setError(null)
      const result = await action()
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <Alert variant="danger" className="w-full max-w-sm text-right">
          {error}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Publicar */}
        {canPublish && !isPublished && !isArchived && (
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => publishProductAction(productId))}
          >
            Publicar
          </Button>
        )}

        {/* Ocultar */}
        {canPublish && isPublished && (
          <Button
            size="sm"
            variant="secondary"
            loading={pending}
            onClick={() => run(() => hideProductAction(productId))}
          >
            Ocultar
          </Button>
        )}

        {/* Enviar a borrador */}
        {canUpdate && !isDraft && !isArchived && (
          <Button
            size="sm"
            variant="ghost"
            loading={pending}
            onClick={() => run(() => setDraftAction(productId))}
          >
            Borrador
          </Button>
        )}

        {/* Archivar */}
        {canDelete && !isArchived && (
          <Button
            size="sm"
            variant="danger"
            loading={pending}
            onClick={() => run(() => archiveProductAction(productId))}
          >
            Archivar
          </Button>
        )}
      </div>
    </div>
  )
}
