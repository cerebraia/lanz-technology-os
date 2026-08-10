'use client'

import { useActionState, useState } from 'react'
import { Modal }    from '@/components/ui/modal'
import { Input }    from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { quickAdjustAction, type QuickAdjustState } from '@/features/inventory/actions/quick-adjust-action'

type Props = {
  productId:   string
  productName: string
  currentOnHand: number
}

export function QuickAdjustButton({ productId, productName, currentOnHand }: Props) {
  const [open, setOpen] = useState(false)

  const [state, action, pending] = useActionState<QuickAdjustState, FormData>(
    quickAdjustAction,
    undefined
  )

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  // Calcular diferencia en tiempo real
  const [preview, setPreview] = useState<number | null>(null)
  const diff = preview !== null ? preview - currentOnHand : null

  function handleClose() {
    if (!pending) {
      setOpen(false)
      setPreview(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-lz-muted transition-colors hover:text-lz-warning"
        title="Ajustar stock"
      >
        Ajustar stock
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Ajustar stock"
        size="sm"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="product_id"     value={productId} />
          <input type="hidden" name="current_on_hand" value={currentOnHand} />

          {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

          {success && (
            <Alert variant="success">
              {(state as { success: true; message: string }).message}
            </Alert>
          )}

          {/* Producto */}
          <div className="rounded-lg bg-lz-surface/60 border border-lz-border/50 px-4 py-3">
            <p className="text-xs text-lz-muted">Producto</p>
            <p className="text-sm font-medium text-lz-text">{productName}</p>
          </div>

          {/* Stock actual */}
          <div className="flex items-center justify-between rounded-lg bg-lz-surface/60 border border-lz-border/50 px-4 py-3">
            <p className="text-xs text-lz-muted">Stock actual (físico)</p>
            <p className="tabular-nums text-sm font-bold text-lz-text">{currentOnHand}</p>
          </div>

          {/* Nuevo stock */}
          <Input
            label="Nuevo stock físico"
            name="new_on_hand"
            type="number"
            min={0}
            step={1}
            required
            placeholder={String(currentOnHand)}
            hint="Cantidad real contada físicamente."
            error={errors.new_on_hand?.[0]}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              setPreview(isNaN(v) ? null : v)
            }}
          />

          {/* Vista previa de la diferencia */}
          {diff !== null && diff !== 0 && (
            <div className={[
              'flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm',
              diff > 0
                ? 'border-lz-success/30 bg-lz-success/10 text-lz-success'
                : 'border-lz-warning/30 bg-lz-warning/10 text-lz-warning',
            ].join(' ')}>
              <span className="text-xs font-medium">Diferencia</span>
              <span className="tabular-nums font-bold">
                {diff > 0 ? `+${diff}` : diff} unidades
              </span>
            </div>
          )}
          {diff === 0 && preview !== null && (
            <p className="text-xs text-lz-muted text-center">Sin cambio respecto al stock actual.</p>
          )}

          {/* Motivo */}
          <Textarea
            label="Motivo"
            name="reason"
            rows={2}
            placeholder="Conteo físico, corrección de diferencia…"
            hint="Opcional. Se guardará en el historial de movimientos."
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={pending}
              disabled={diff === 0 && preview !== null}
            >
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
