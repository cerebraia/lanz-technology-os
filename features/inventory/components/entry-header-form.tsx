'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { EntryActionState } from '@/features/inventory/actions/entry-actions'

const ENTRY_TYPE_OPTIONS = [
  { value: 'purchase',   label: 'Compra local' },
  { value: 'import',     label: 'Importación' },
  { value: 'return',     label: 'Devolución' },
  { value: 'adjustment', label: 'Ajuste positivo' },
]

type Props = {
  action: (prev: EntryActionState, fd: FormData) => Promise<EntryActionState>
}

export function EntryHeaderForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Select
        label="Tipo de entrada"
        name="entry_type"
        required
        options={ENTRY_TYPE_OPTIONS}
        defaultValue="purchase"
        error={errors.entry_type?.[0]}
      />

      <Input
        label="Referencia"
        name="reference"
        required
        placeholder="OC-001, IMP-2026-01, DEVOL-003…"
        hint="Identificador único de esta entrada (factura, orden de compra, etc.)."
        error={errors.reference?.[0]}
      />

      <Input
        label="Proveedor"
        name="supplier_name"
        placeholder="Nombre del proveedor (opcional)"
      />

      <Textarea
        label="Observaciones"
        name="notes"
        rows={2}
        placeholder="Notas opcionales sobre esta entrada."
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          Crear entrada y agregar productos →
        </Button>
      </div>
    </form>
  )
}
