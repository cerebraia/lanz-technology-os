'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { PurchaseActionState } from '@/features/purchases/actions/purchase-actions'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'VES', label: 'VES — Bolívar soberano' },
]

type Props = {
  action: (prev: PurchaseActionState, fd: FormData) => Promise<PurchaseActionState>
}

export function PurchaseHeaderForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Input
        label="Referencia"
        name="reference"
        required
        placeholder="OC-2026-001, PO-DJI-001…"
        hint="Identificador único de la orden de compra."
        error={errors.reference?.[0]}
      />

      <Input
        label="Proveedor"
        name="supplier_name"
        placeholder="Nombre del proveedor (opcional)"
      />

      <Select
        label="Moneda"
        name="currency"
        required
        options={CURRENCY_OPTIONS}
        defaultValue="USD"
        error={errors.currency?.[0]}
      />

      <Textarea
        label="Observaciones"
        name="notes"
        rows={2}
        placeholder="Notas opcionales sobre esta orden."
      />

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={pending}>
          Crear orden y agregar productos →
        </Button>
      </div>
    </form>
  )
}
