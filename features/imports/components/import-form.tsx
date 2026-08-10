'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { Import } from '@/features/imports/data/imports'
import type { ImportActionState } from '@/features/imports/actions/import-actions'

const SHIPPING_OPTIONS = [
  { value: '',        label: 'Sin especificar' },
  { value: 'air',     label: 'Aéreo' },
  { value: 'sea',     label: 'Marítimo' },
  { value: 'land',    label: 'Terrestre' },
  { value: 'courier', label: 'Courier' },
]

type Props = {
  action:      (prev: ImportActionState, fd: FormData) => Promise<ImportActionState>
  imp?:        Import
  submitLabel?: string
}

export function ImportForm({ action, imp, submitLabel = 'Guardar importación' }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-6">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Referencia"
          name="reference"
          required
          defaultValue={imp?.reference ?? ''}
          placeholder="IMP-2026-001"
          hint="Identificador único de esta importación."
          error={errors.reference?.[0]}
        />
        <Select
          label="Método de envío"
          name="shipping_method"
          options={SHIPPING_OPTIONS}
          defaultValue={imp?.shipping_method ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="País de origen"
          name="origin_country"
          required
          defaultValue={imp?.origin_country ?? ''}
          placeholder="China, Estados Unidos…"
          error={errors.origin_country?.[0]}
        />
        <Input
          label="País de destino"
          name="destination_country"
          defaultValue={imp?.destination_country ?? 'Venezuela'}
          placeholder="Venezuela"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Salida estimada"
          name="estimated_departure"
          type="date"
          defaultValue={imp?.estimated_departure ?? ''}
        />
        <Input
          label="Llegada estimada"
          name="estimated_arrival"
          type="date"
          defaultValue={imp?.estimated_arrival ?? ''}
        />
      </div>

      <Textarea
        label="Observaciones"
        name="notes"
        rows={3}
        defaultValue={imp?.notes ?? ''}
        placeholder="Notas internas sobre esta importación."
      />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
