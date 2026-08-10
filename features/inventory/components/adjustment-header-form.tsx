'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { AdjustmentActionState } from '@/features/inventory/actions/adjustment-actions'

type Props = {
  action: (prev: AdjustmentActionState, fd: FormData) => Promise<AdjustmentActionState>
}

export function AdjustmentHeaderForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Input
        label="Referencia"
        name="reference"
        required
        placeholder="AJUSTE-2026-001, CONTEO-JUL-001…"
        hint="Identificador único de este ajuste."
        error={errors.reference?.[0]}
      />

      <Input
        label="Motivo"
        name="reason"
        required
        placeholder="Conteo físico mensual, corrección de diferencias…"
        hint="Descripción del motivo que origina el ajuste."
        error={errors.reason?.[0]}
      />

      <Textarea
        label="Observaciones"
        name="notes"
        rows={2}
        placeholder="Notas opcionales sobre este ajuste."
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          Crear ajuste y agregar productos →
        </Button>
      </div>
    </form>
  )
}
