'use client'

import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { slugify } from '@/lib/utils/slugify'
import type { Category } from '@/features/catalog/data/categories'
import type { CategoryActionState } from '@/features/catalog/actions/category-actions'

type CategoryFormProps = {
  action: (prev: CategoryActionState, fd: FormData) => Promise<CategoryActionState>
  initialData?: Category
  submitLabel?: string
}

const STATUS_OPTIONS = [
  { value: 'true',  label: 'Activa' },
  { value: 'false', label: 'Inactiva' },
]

export function CategoryForm({
  action,
  initialData,
  submitLabel = 'Guardar',
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [slug, setSlug]           = useState(initialData?.slug ?? '')
  const [autoSlug, setAutoSlug]   = useState(!initialData)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (autoSlug) setSlug(slugify(e.target.value))
  }

  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-5">
      {errors._ && (
        <Alert variant="danger">{errors._.join('. ')}</Alert>
      )}

      {state && 'success' in state && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <Input
        label="Nombre"
        name="name"
        required
        defaultValue={initialData?.name}
        onChange={handleNameChange}
        placeholder="Drones DJI"
        error={errors.name?.[0]}
      />

      <Input
        label="Slug (URL)"
        name="slug"
        required
        value={slug}
        onChange={(e) => {
          setAutoSlug(false)
          setSlug(e.target.value)
        }}
        placeholder="drones-dji"
        hint="Identificador único para la URL. Solo letras minúsculas, números y guiones."
        error={errors.slug?.[0]}
      />

      <Textarea
        label="Descripción"
        name="description"
        defaultValue={initialData?.description ?? ''}
        placeholder="Descripción opcional de la categoría"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Orden de presentación"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={initialData?.sort_order ?? 0}
        />
        <Select
          label="Estado"
          name="is_active"
          options={STATUS_OPTIONS}
          defaultValue={String(initialData?.is_active ?? true)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
