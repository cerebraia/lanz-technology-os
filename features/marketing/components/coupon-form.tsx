'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { COUPON_TYPE_OPTIONS } from '@/features/marketing/data/constants'
import { createCouponAction, type MarketingActionState } from '@/features/marketing/actions/marketing-actions'

export function CouponForm() {
  const [state, formAction, pending] = useActionState<MarketingActionState, FormData>(
    createCouponAction, undefined
  )
  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state ? state : null

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {success   && <Alert variant="success">{success.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Código"
          name="code"
          required
          placeholder="Ej: BIENVENIDO20"
          error={errors.code?.[0]}
        />
        <Select
          label="Tipo de descuento"
          name="type"
          required
          options={COUPON_TYPE_OPTIONS}
          error={errors.type?.[0]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Valor del descuento"
          name="value"
          type="number"
          min={0.01}
          step={0.01}
          required
          placeholder="Ej: 10 (%) o 5.00 ($)"
          error={errors.value?.[0]}
        />
        <Input
          label="Monto mínimo de compra"
          name="minimum_amount"
          type="number"
          min={0}
          step={0.01}
          defaultValue="0"
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Límite de usos"      name="usage_limit" type="number" min={1} placeholder="Sin límite" />
        <Input label="Fecha de expiración" name="expires_at"  type="date" />
      </div>

      <Textarea label="Descripción interna" name="description" rows={2} placeholder="Contexto del cupón" />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" size="sm" loading={pending}>Crear cupón</Button>
      </div>
    </form>
  )
}
