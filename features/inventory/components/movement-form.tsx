'use client'

import { useActionState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import type { MovementActionState } from '@/features/inventory/actions/inventory-actions'

type ProductOption = { value: string; label: string }

type MovementFormProps = {
  action: (prev: MovementActionState, fd: FormData) => Promise<MovementActionState>
  products: ProductOption[]
  defaultProductId?: string
  type: 'entry' | 'exit' | 'adjustment' | 'reservation' | 'release'
  submitLabel?: string
}

const TYPE_META: Record<MovementFormProps['type'], { title: string; hint: string; color: string }> = {
  entry:       { title: 'Entrada de inventario',     hint: 'Aumenta el stock disponible.',                    color: 'text-lz-success' },
  exit:        { title: 'Salida de inventario',      hint: 'Reduce el stock disponible.',                     color: 'text-lz-danger'  },
  adjustment:  { title: 'Ajuste de inventario',      hint: 'Corrige el stock con un ajuste controlado.',      color: 'text-lz-warning' },
  reservation: { title: 'Reserva de inventario',     hint: 'Compromete unidades disponibles.',                color: 'text-lz-primary' },
  release:     { title: 'Liberación de reserva',     hint: 'Devuelve unidades reservadas a disponibilidad.', color: 'text-lz-muted'   },
}

const DIRECTION_OPTIONS = [
  { value: 'in',  label: 'Entrada (+)' },
  { value: 'out', label: 'Salida (−)'  },
]

export function MovementForm({
  action,
  products,
  defaultProductId,
  type,
  submitLabel = 'Registrar movimiento',
}: MovementFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const meta   = TYPE_META[type]
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-5">
      {errors._ && (
        <Alert variant="danger">{errors._.join('. ')}</Alert>
      )}
      {state && 'success' in state && (
        <Alert variant="success">{state.message}</Alert>
      )}

      <Card>
        <p className={['text-xs font-semibold uppercase tracking-wider', meta.color].join(' ')}>
          {meta.title}
        </p>
        <p className="mt-0.5 mb-4 text-xs text-lz-muted">{meta.hint}</p>

        <div className="space-y-4">
          <Select
            label="Producto"
            name="product_id"
            required
            options={products}
            defaultValue={defaultProductId ?? ''}
            placeholder="Seleccionar producto"
            error={errors.product_id?.[0]}
          />

          {type === 'adjustment' && (
            <Select
              label="Dirección"
              name="direction"
              required
              options={DIRECTION_OPTIONS}
              defaultValue="in"
              error={errors.direction?.[0]}
            />
          )}

          <Input
            label="Cantidad"
            name="quantity"
            type="number"
            min={1}
            step={1}
            required
            placeholder="0"
            hint="Número entero mayor a cero."
            error={errors.quantity?.[0]}
          />

          <Input
            label="Motivo"
            name="reason"
            required
            placeholder={
              type === 'entry'       ? 'Ej. Recepción de mercancía — OC-001' :
              type === 'exit'        ? 'Ej. Producto defectuoso descartado' :
              type === 'adjustment'  ? 'Ej. Conteo físico — diferencia detectada' :
              type === 'reservation' ? 'Ej. Pedido PED-001 confirmado' :
              'Ej. Pedido PED-001 cancelado'
            }
            error={errors.reason?.[0]}
          />

          <Textarea
            label="Notas adicionales"
            name="notes"
            rows={2}
            placeholder="Observaciones opcionales."
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
