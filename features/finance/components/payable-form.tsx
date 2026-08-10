'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select }   from '@/components/ui/select'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { CURRENCY_OPTIONS } from '@/features/finance/data/constants'
import { createPayableAction, type FinanceActionState } from '@/features/finance/actions/finance-actions'

export function PayableForm() {
  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(
    createPayableAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Input
        label="Descripción"
        name="description"
        required
        placeholder="Factura proveedor, deuda compra, etc."
        error={errors.description?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Monto"
          name="amount"
          type="number"
          min={0.01}
          step={0.01}
          required
          placeholder="0.00"
          error={errors.amount?.[0]}
        />
        <Select label="Moneda" name="currency" required options={CURRENCY_OPTIONS} defaultValue="USD" />
        <Input label="Fecha de vencimiento" name="due_date" type="date" />
      </div>

      <Textarea label="Notas" name="notes" rows={2} placeholder="Observaciones internas." />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>Registrar cuenta por pagar</Button>
      </div>
    </form>
  )
}
