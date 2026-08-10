'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { SOURCE_LABELS } from '@/features/crm/data/constants'
import { createCustomerAction, updateCustomerAction, type CrmActionState } from '@/features/crm/actions/crm-actions'
import type { Customer } from '@/features/crm/data/customers'

const SOURCE_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
]

type Props = { customer?: Customer }

export function CustomerForm({ customer }: Props) {
  const action = customer
    ? updateCustomerAction.bind(null, customer.id)
    : createCustomerAction

  const [state, formAction, pending] = useActionState<CrmActionState, FormData>(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-5">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {'success' in (state ?? {}) && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          name="first_name"
          required
          defaultValue={customer?.first_name ?? ''}
          placeholder="Nombre del cliente"
          error={errors.first_name?.[0]}
        />
        <Input
          label="Apellido"
          name="last_name"
          defaultValue={customer?.last_name ?? ''}
          placeholder="Apellido"
        />
      </div>

      <Input
        label="Empresa / Organización"
        name="company"
        defaultValue={customer?.company ?? ''}
        placeholder="Nombre de la empresa (opcional)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          defaultValue={customer?.email ?? ''}
          placeholder="correo@ejemplo.com"
          error={errors.email?.[0]}
        />
        <Input
          label="Teléfono"
          name="phone"
          type="tel"
          defaultValue={customer?.phone ?? ''}
          placeholder="+58 412 0000000"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          defaultValue={customer?.whatsapp ?? ''}
          placeholder="+58 412 0000000"
        />
        <Select
          label="Canal de origen"
          name="source"
          options={SOURCE_OPTIONS}
          defaultValue={customer?.source ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="País"
          name="country"
          defaultValue={customer?.country ?? ''}
          placeholder="Venezuela"
        />
        <Input
          label="Ciudad"
          name="city"
          defaultValue={customer?.city ?? ''}
          placeholder="Caracas"
        />
      </div>

      <Textarea
        label="Dirección"
        name="address"
        rows={2}
        defaultValue={customer?.address ?? ''}
        placeholder="Dirección de envío o residencia"
      />

      <Textarea
        label="Notas internas"
        name="notes"
        rows={3}
        defaultValue={customer?.notes ?? ''}
        placeholder="Observaciones, preferencias, historial informal…"
      />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>
          {customer ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
