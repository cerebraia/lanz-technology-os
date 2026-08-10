'use client'

import { useActionState, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { addEntryItemAction, removeEntryItemAction } from '@/features/inventory/actions/entry-actions'
import type { EntryItem } from '@/features/inventory/data/entries'
import type { EntryActionState } from '@/features/inventory/actions/entry-actions'

type ProductOption = { value: string; label: string }

type Props = {
  entryId:  string
  items:    EntryItem[]
  products: ProductOption[]
}

function ItemRow({
  item,
  entryId,
}: {
  item:    EntryItem
  entryId: string
}) {
  const [error,    setError]  = useState<string | null>(null)
  const [pending,  start]     = useTransition()

  async function handleRemove() {
    start(async () => {
      setError(null)
      const result = await removeEntryItemAction(item.id, entryId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <>
      {error && (
        <tr>
          <td colSpan={4}>
            <Alert variant="danger">{error}</Alert>
          </td>
        </tr>
      )}
      <tr className="border-b border-lz-border/50 transition-colors last:border-0 hover:bg-lz-surface/60">
        <td className="px-4 py-3">
          <p className="text-sm text-lz-text">{item.products?.name ?? '—'}</p>
          <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
          {item.quantity}
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
  entryId,
  products,
}: {
  entryId:  string
  products: ProductOption[]
}) {
  const boundAction = addEntryItemAction.bind(null, entryId)
  const [state, formAction, pending] = useActionState<EntryActionState, FormData>(
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
          label="Cantidad"
          name="quantity"
          type="number"
          min={1}
          step={1}
          required
          placeholder="0"
          error={errors.quantity?.[0]}
        />
      </div>
      <Input
        label="Notas"
        name="notes"
        placeholder="Observación opcional para este ítem."
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Agregar producto
        </Button>
      </div>
    </form>
  )
}

export function EntryItemsManager({ entryId, items, products }: Props) {
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div className="space-y-4">
      {/* Items table */}
      {items.length === 0 ? (
        <p className="text-sm text-lz-muted">
          Sin productos. Agrega al menos uno antes de confirmar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Cant.</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Notas</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ItemRow key={item.id} item={item} entryId={entryId} />
              ))}
            </tbody>
            <tfoot className="border-t border-lz-border bg-lz-surface/50">
              <tr>
                <td className="px-4 py-2 text-xs font-medium text-lz-muted">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-sm font-semibold text-lz-text">
                  {totalUnits}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add form */}
      <div className="border-t border-lz-border/50 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lz-muted">
          Agregar producto
        </p>
        <AddItemForm entryId={entryId} products={products} />
      </div>
    </div>
  )
}
