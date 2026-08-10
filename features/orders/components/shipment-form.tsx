'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { addShipmentAction, type OrderActionState } from '@/features/orders/actions/order-actions'

type Props = { orderId: string }

export function ShipmentForm({ orderId }: Props) {
  const bound = addShipmentAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(bound, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {'success' in (state ?? {}) && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Transportista" name="carrier" placeholder="Ej: MRW, Zoom, Delivery propio" />
        <Input label="Nro. de tracking" name="tracking_number" placeholder="Ej: MRW-000123" />
      </div>
      <Textarea label="Notas" name="notes" rows={2} placeholder="Instrucciones de entrega, observaciones…" />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>Registrar envío</Button>
      </div>
    </form>
  )
}
