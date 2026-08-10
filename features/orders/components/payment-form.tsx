'use client'

import { useActionState } from 'react'
import { Input }   from '@/components/ui/input'
import { Select }  from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }  from '@/components/ui/button'
import { Alert }   from '@/components/ui/alert'
import { addPaymentAction, type OrderActionState } from '@/features/orders/actions/order-actions'
import { PAYMENT_METHOD_OPTIONS, CURRENCY_OPTIONS } from '@/features/orders/data/constants'

type Props = { orderId: string; pendingAmount: number; currency: string }

export function PaymentForm({ orderId, pendingAmount, currency }: Props) {
  const bound = addPaymentAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(bound, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {'success' in (state ?? {}) && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Monto"
          name="amount"
          type="number"
          min={0.01}
          step={0.01}
          required
          defaultValue={pendingAmount > 0 ? String(pendingAmount.toFixed(2)) : ''}
          placeholder="0.00"
          error={errors.amount?.[0]}
        />
        <Select label="Moneda"  name="currency" options={CURRENCY_OPTIONS} defaultValue={currency} />
        <Select label="Método"  name="method"   options={PAYMENT_METHOD_OPTIONS} required error={errors.method?.[0]} />
      </div>
      <Input label="Referencia / Nro. confirmación" name="reference" placeholder="Ej: TXN-00123" />
      <Textarea label="Notas" name="notes" rows={2} placeholder="Observaciones del pago" />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>Registrar pago</Button>
      </div>
    </form>
  )
}
