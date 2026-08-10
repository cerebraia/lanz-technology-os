'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import {
  uploadProductImageAction,
  deleteProductImageAction,
  setPrimaryImageAction,
  moveImageAction,
} from '@/features/catalog/actions/image-actions'
import { getPublicImageUrl } from '@/lib/utils/storage'
import type { ProductImage } from '@/features/catalog/data/products'
import { IconImage, IconPlus } from '@/components/icons'

const MAX_IMAGES    = 10
const MAX_MB        = 5
const ALLOWED_LABEL = 'JPEG, PNG o WebP — máx. 5 MB'

type ProductImagesProps = {
  productId: string
  images: ProductImage[]
}

function ChevronUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export function ProductImages({ productId, images }: ProductImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError]       = useState<string | null>(null)
  const [pending, startPending] = useTransition()

  const atLimit = images.length >= MAX_IMAGES

  function clearError() { setError(null) }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side pre-check to give instant feedback
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB.`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const fd = new FormData()
    fd.append('file', file)

    startPending(async () => {
      setError(null)
      const result = await uploadProductImageAction(productId, fd)
      if (result && 'error' in result) setError(result.error)
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  async function handleDelete(imageId: string, storagePath: string) {
    startPending(async () => {
      setError(null)
      const result = await deleteProductImageAction(imageId, storagePath, productId)
      if (result.error) setError(result.error)
    })
  }

  async function handleSetPrimary(imageId: string) {
    startPending(async () => {
      setError(null)
      const result = await setPrimaryImageAction(imageId, productId)
      if (result.error) setError(result.error)
    })
  }

  async function handleMove(imageId: string, direction: 'up' | 'down') {
    startPending(async () => {
      setError(null)
      const result = await moveImageAction(imageId, productId, direction)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-4">

      {/* Error */}
      {error && (
        <Alert variant="danger" title="Error al gestionar imagen">
          {error}
        </Alert>
      )}

      {/* Upload bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={atLimit || pending}
            onClick={() => { clearError(); inputRef.current?.click() }}
          >
            {pending ? <Spinner size="sm" /> : <IconPlus size={14} />}
            Subir imagen
          </Button>
          <span className="text-xs text-lz-muted">{ALLOWED_LABEL}</span>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-1.5">
          <span className={['text-xs font-medium', atLimit ? 'text-lz-warning' : 'text-lz-muted'].join(' ')}>
            {images.length} / {MAX_IMAGES}
          </span>
          {atLimit && (
            <Badge variant="warning">Límite alcanzado</Badge>
          )}
        </div>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <EmptyState
          icon={<IconImage size={22} className="text-lz-muted" />}
          title="Sin imágenes"
          description="Sube la primera imagen para este producto."
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => { clearError(); inputRef.current?.click() }}
            >
              <IconPlus size={14} />
              Subir primera imagen
            </Button>
          }
        />
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={[
                'group relative overflow-hidden rounded-xl border bg-lz-sidebar transition-colors',
                img.is_primary ? 'border-lz-primary ring-1 ring-lz-primary/30' : 'border-lz-border',
                pending ? 'opacity-60 pointer-events-none' : '',
              ].join(' ')}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={getPublicImageUrl(img.storage_path)}
                  alt={img.alt_text ?? 'Imagen del producto'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Principal badge */}
                {img.is_primary && (
                  <div className="absolute left-1.5 top-1.5">
                    <Badge variant="primary">Principal</Badge>
                  </div>
                )}

                {/* Position badge */}
                <div className="absolute right-1.5 top-1.5">
                  <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {idx + 1}
                  </span>
                </div>
              </div>

              {/* Actions bar (always visible, below image) */}
              <div className="flex items-center justify-between gap-1 border-t border-lz-border/50 bg-lz-bg/80 px-2 py-1.5">
                {/* Reorder */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mover arriba"
                    disabled={idx === 0 || pending}
                    onClick={() => handleMove(img.id, 'up')}
                    className="rounded p-1 text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover abajo"
                    disabled={idx === images.length - 1 || pending}
                    onClick={() => handleMove(img.id, 'down')}
                    className="rounded p-1 text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDownIcon />
                  </button>
                </div>

                {/* Set primary */}
                {!img.is_primary && (
                  <button
                    type="button"
                    aria-label="Establecer como principal"
                    disabled={pending}
                    onClick={() => handleSetPrimary(img.id)}
                    className="rounded px-1.5 py-1 text-[10px] font-medium text-lz-muted transition-colors hover:bg-lz-primary/20 hover:text-lz-accent disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Principal
                  </button>
                )}
                {img.is_primary && (
                  <span className="text-[10px] font-medium text-lz-primary">✓ Principal</span>
                )}

                {/* Delete */}
                <button
                  type="button"
                  aria-label="Eliminar imagen"
                  disabled={pending}
                  onClick={() => handleDelete(img.id, img.storage_path)}
                  className="rounded p-1 text-lz-muted transition-colors hover:bg-lz-danger/20 hover:text-lz-danger disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending overlay hint */}
      {pending && images.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-lz-muted">
          <Spinner size="sm" className="text-lz-primary" />
          Procesando…
        </div>
      )}
    </div>
  )
}
