'use client'

import { useActionState, useState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { Modal }    from '@/components/ui/modal'
import {
  updateSaleDetailsAction,
  updateSaleCustomerAction,
  type SaleActionState,
} from '@/features/sales/actions/sales-actions'
import {
  MANUAL_SALE_CHANNEL_OPTIONS,
  MANUAL_SALE_PAYMENT_OPTIONS,
} from '@/features/orders/data/constants'

// ─── Edit sale details (notes, channel, payment method) ───────────────────────

type DetailsProps = {
  orderId:       string
  notes:         string | null
  saleChannel:   string
  paymentMethod: string | null
  disabled?:     boolean
}

export function SaleDetailsEditButton({ orderId, notes, saleChannel, paymentMethod, disabled }: DetailsProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<SaleActionState, FormData>(
    updateSaleDetailsAction,
    undefined
  )

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={disabled}>
        Editar detalles
      </Button>

      <Modal
        open={open}
        onClose={() => { if (!pending) setOpen(false) }}
        title="Editar detalles de la venta"
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="order_id" value={orderId} />

          {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
          {success   && <Alert variant="success">Venta actualizada.</Alert>}

          <Select
            label="Canal de venta"
            name="sale_channel"
            defaultValue={saleChannel}
            options={MANUAL_SALE_CHANNEL_OPTIONS}
          />
          <Select
            label="Método de pago"
            name="payment_method"
            defaultValue={paymentMethod ?? ''}
            placeholder="Sin especificar"
            options={MANUAL_SALE_PAYMENT_OPTIONS}
          />
          <Textarea
            label="Observaciones"
            name="notes"
            defaultValue={notes ?? ''}
            rows={3}
            placeholder="Notas internas de la venta…"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ─── Edit customer data ───────────────────────────────────────────────────────

type CustomerProps = {
  customerId: string
  firstName:  string
  lastName:   string | null
  phone:      string | null
  email:      string | null
  address:    string | null
}

export function SaleCustomerEditButton({ customerId, firstName, lastName, phone, email, address }: CustomerProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<SaleActionState, FormData>(
    updateSaleCustomerAction,
    undefined
  )

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Editar cliente
      </Button>

      <Modal
        open={open}
        onClose={() => { if (!pending) setOpen(false) }}
        title="Editar datos del cliente"
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="customer_id" value={customerId} />

          {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
          {success   && <Alert variant="success">Cliente actualizado.</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              name="first_name"
              defaultValue={firstName}
              required
              error={errors.first_name?.[0]}
            />
            <Input
              label="Apellido"
              name="last_name"
              defaultValue={lastName ?? ''}
            />
          </div>
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            defaultValue={phone ?? ''}
          />
          <Input
            label="Correo"
            name="email"
            type="email"
            defaultValue={email ?? ''}
          />
          <Input
            label="Dirección"
            name="address"
            defaultValue={address ?? ''}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
