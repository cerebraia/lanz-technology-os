'use client'

import { useActionState, useState, useTransition } from 'react'
import { Input }   from '@/components/ui/input'
import { Button }  from '@/components/ui/button'
import { Alert }   from '@/components/ui/alert'
import {
  saveRateManualAction,
  refreshBCVRateAction,
  refreshBinanceRateAction,
  type RateActionState,
} from '@/features/exchange-rates/actions/rate-actions'

type Props = {
  source:      'bcv' | 'binance'
  currentRate: number | null
  label:       string
  currency:    string
}

export function RateForm({ source, currentRate, label, currency }: Props) {
  const [state, action, pending] = useActionState<RateActionState, FormData>(
    saveRateManualAction,
    undefined
  )

  const [refreshResult, setRefreshResult] = useState<{ error?: string; rate?: number } | null>(null)
  const [refreshing, startRefresh] = useTransition()

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  function handleRefresh() {
    startRefresh(async () => {
      setRefreshResult(null)
      const fn = source === 'bcv' ? refreshBCVRateAction : refreshBinanceRateAction
      const result = await fn()
      setRefreshResult(result)
    })
  }

  return (
    <div className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {success && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}
      {refreshResult?.error && <Alert variant="danger">Error al actualizar: {refreshResult.error}</Alert>}
      {refreshResult?.rate  && <Alert variant="success">Tasa actualizada automáticamente: {refreshResult.rate} Bs/{currency}</Alert>}

      <form action={action} className="flex items-end gap-3">
        <input type="hidden" name="source" value={source} />
        <div className="flex-1">
          <Input
            label={label}
            name="rate"
            type="number"
            min={0.01}
            step={0.01}
            required
            defaultValue={currentRate ?? ''}
            placeholder="40.00"
            hint={`Bs por 1 ${currency}`}
            error={errors.rate?.[0]}
          />
        </div>
        <Button type="submit" size="sm" loading={pending} className="shrink-0">
          Guardar manual
        </Button>
      </form>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={refreshing}
        onClick={handleRefresh}
      >
        Actualizar automáticamente
      </Button>
    </div>
  )
}
