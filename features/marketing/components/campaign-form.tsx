'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { CAMPAIGN_TYPE_OPTIONS } from '@/features/marketing/data/constants'
import { createCampaignAction, type MarketingActionState } from '@/features/marketing/actions/marketing-actions'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'VES', label: 'VES' },
]

type Props = {
  segmentOptions: { value: string; label: string }[]
}

export function CampaignForm({ segmentOptions }: Props) {
  const [state, formAction, pending] = useActionState<MarketingActionState, FormData>(
    createCampaignAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-5">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Input
        label="Nombre de la campaña"
        name="name"
        required
        placeholder="Ej: Black Friday 2026, Reactivación clientes…"
        error={errors.name?.[0]}
      />

      <Textarea
        label="Descripción"
        name="description"
        rows={2}
        placeholder="Objetivo y contexto de la campaña."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          name="type"
          required
          options={CAMPAIGN_TYPE_OPTIONS}
          error={errors.type?.[0]}
        />
        <Select
          label="Segmento objetivo"
          name="segment_id"
          options={segmentOptions}
          defaultValue=""
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Fecha de inicio"  name="start_date" type="date" />
        <Input label="Fecha de fin"     name="end_date"   type="date" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Presupuesto"
          name="budget"
          type="number"
          min={0}
          step={0.01}
          placeholder="0.00 (opcional)"
          error={errors.budget?.[0]}
        />
        <Select label="Moneda" name="currency" options={CURRENCY_OPTIONS} defaultValue="USD" />
      </div>

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>Crear campaña</Button>
      </div>
    </form>
  )
}
