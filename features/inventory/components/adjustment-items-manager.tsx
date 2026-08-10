'use client'

import { useActionState, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  addAdjustmentItemAction,
  removeAdjustmentItemAction,
} from '@/features/inventory/actions/adjustment-actions'
import type { AdjustmentItem } from '@/features/inventory/data/adjustments'
import type { AdjustmentActionState } from '@/features/inventory/actions/adjustment-actions'

type ProductOption = { value: string; label: string }

type Props = {
  adjustmentId: string
  items:        AdjustmentItem[]
  products:     ProductOption[]
}

function DiffBadge({ difference }: { difference: number }) {
  if (difference > 0) return <Badge variant="success">+{difference}</Badge>
  if (difference < 0) return <Badge variant="danger">{difference}</Badge>
  return <Badge variant="neutral">Sin cambio</Badge>
}

function ItemRow({
  item,
  adjustmentId,
}: {
  item:         AdjustmentItem
  adjustmentId: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()

  async function handleRemove() {
    start(async () => {
      setError(null)
      const result = await removeAdjustmentItemAction(item.id, adjustmentId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <>
      {error && (
        <tr><td colSpan={6}><Alert variant="danger">{error}</Alert></td></tr>
      )}
      <tr className="border-b border-lz-border/50 transition-colors last:border-0 hover:bg-lz-surface/60">
        <td className="px-4 py-3">
          <p className="text-sm text-lz-text">{item.products?.name ?? '—'}</p>
          <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-muted">
          {item.current_stock}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
          {item.physical_stock}
        </td>
        <td className="px-4 py-3 text-center">
          <DiffBadge difference={item.difference} />
        </td>
        <td className="px-4 py-3 text-xs text-lz-muted hidden sm:table-cell">
          {item.notes ?? '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={pending}
            onClick={handleRemove}
            className="text-xs text-lz-muted transition-colors hover:text-lz-danger disabled:opacity-40"
          >
            {pending ? '…' : 'Eliminar'}
          </button>
        </td>
      </tr>
    </>
  )
}

function AddItemForm({
  adjustmentId,
  products,
}: {
  adjustmentId: string
  products:     ProductOption[]
}) {
  const boundAction = addAdjustmentItemAction.bind(null, adjustmentId)
  const [state, formAction, pending] = useActionState<AdjustmentActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {state && 'success' in state && <Alert variant="success">{state.message}</Alert>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Select
            label="Producto"
            name="product_id"
            required
            options={products}
            placeholder="Seleccionar producto"
            error={errors.product_id?.[0]}
          />
        </div>
        <Input
          label="Conteo físico"
          name="physical_stock"
          type="number"
          min={0}
          step={1}
          required
          placeholder="0"
          hint="Cantidad contada físicamente."
          error={errors.physical_stock?.[0]}
        />
      </div>
      <Input
        label="Notas"
        name="notes"
        placeholder="Observación opcional para este ítem."
      />
      <p className="text-xs text-lz-muted">
        El stock actual del sistema se captura automáticamente al agregar el producto.
      </p>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Agregar producto
        </Button>
      </div>
    </form>
  )
}

export function AdjustmentItemsManager({ adjustmentId, items, products }: Props) {
  const totalAdded   = items.filter((i) => i.difference > 0).reduce((a, i) => a + i.difference, 0)
  const totalRemoved = items.filter((i) => i.difference < 0).reduce((a, i) => a + Math.abs(i.difference), 0)
  const hasChanges   = items.some((i) => i.difference !== 0)

  return (
    <div className="space-y-4">
      {/* Tabla de ítems */}
      {items.length === 0 ? (
        <p className="text-sm text-lz-muted">
          Sin productos. Agrega al menos uno con diferencia distinta de cero antes de confirmar.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-lz-border">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-sidebar">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">En sistema</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Conteo</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Diferencia</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Notas</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} adjustmentId={adjustmentId} />
                ))}
              </tbody>
              <tfoot className="border-t border-lz-border bg-lz-surface/50">
                <tr>
                  <td className="px-4 py-2 text-xs text-lz-muted">
                    {items.length} {items.length === 1 ? 'producto' : 'productos'}
                  </td>
                  <td colSpan={2} />
                  <td className="px-4 py-2 text-center">
                    <span className="text-xs text-lz-success">+{totalAdded}</span>
                    {' / '}
                    <span className="text-xs text-lz-danger">−{totalRemoved}</span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          {!hasChanges && (
            <Alert variant="warning">
              Todos los conteos coinciden con el sistema. No hay diferencias que ajustar.
            </Alert>
          )}
        </>
      )}

      {/* Formulario de adición */}
      <div className="border-t border-lz-border/50 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lz-muted">
          Agregar producto
        </p>
        <AddItemForm adjustmentId={adjustmentId} products={products} />
      </div>
    </div>
  )
}
