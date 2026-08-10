'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import type { SupplierActionState } from '@/features/suppliers/actions/supplier-actions'
import type { Supplier } from '@/features/suppliers/data/suppliers'

type Props = {
  action:   (prev: SupplierActionState, fd: FormData) => Promise<SupplierActionState>
  supplier?: Supplier
  submitLabel?: string
}

export function SupplierForm({ action, supplier, submitLabel = 'Guardar proveedor' }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-8">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      {/* Información básica */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">
          Información básica
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre del proveedor"
            name="name"
            required
            defaultValue={supplier?.name ?? ''}
            placeholder="Ej: DJI Latam, TechDist S.A."
            hint="Debe ser único. Se usará como identificador principal."
            error={errors.name?.[0]}
          />
          <Input
            label="Empresa"
            name="company"
            defaultValue={supplier?.company ?? ''}
            placeholder="Razón social o nombre comercial"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ''}
            placeholder="contacto@proveedor.com"
            error={errors.email?.[0]}
          />
          <Input
            label="Teléfono"
            name="phone"
            defaultValue={supplier?.phone ?? ''}
            placeholder="+58 212 555 0000"
          />
        </div>
      </section>

      {/* Ubicación */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">
          Ubicación
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="País"
            name="country"
            required
            defaultValue={supplier?.country ?? ''}
            placeholder="Venezuela, Estados Unidos, China…"
            error={errors.country?.[0]}
          />
          <Input
            label="Ciudad"
            name="city"
            defaultValue={supplier?.city ?? ''}
            placeholder="Ciudad principal"
          />
        </div>

        <Input
          label="Dirección"
          name="address"
          defaultValue={supplier?.address ?? ''}
          placeholder="Dirección física o de envío"
        />
      </section>

      {/* Información fiscal */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">
          Información fiscal
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Identificación fiscal"
            name="tax_id"
            defaultValue={supplier?.tax_id ?? ''}
            placeholder="RIF, EIN, NIT…"
          />
          <Input
            label="Sitio web"
            name="website"
            defaultValue={supplier?.website ?? ''}
            placeholder="https://proveedor.com"
          />
        </div>
      </section>

      {/* Notas */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">
          Observaciones internas
        </p>
        <Textarea
          label="Notas"
          name="notes"
          rows={3}
          defaultValue={supplier?.notes ?? ''}
          placeholder="Información interna sobre este proveedor (condiciones de pago, tiempo de entrega, etc.)."
        />
      </section>

      <div className="flex justify-end border-t border-lz-border pt-6">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
