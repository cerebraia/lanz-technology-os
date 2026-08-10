'use client'

import { useActionState, useState, useTransition } from 'react'
import { Input }   from '@/components/ui/input'
import { Select }  from '@/components/ui/select'
import { Button }  from '@/components/ui/button'
import { Alert }   from '@/components/ui/alert'
import { addOrderItemAction, removeOrderItemAction, type OrderActionState } from '@/features/orders/actions/order-actions'
import type { OrderItem } from '@/features/orders/data/orders'

type ProductOption = { value: string; label: string; price: number }

type Props = {
  orderId:   string
  items:     OrderItem[]
  products:  ProductOption[]
  currency:  string
  readOnly?: boolean
}

function ItemRow({ item, orderId }: { item: OrderItem; orderId: string }) {
  const [error,   setError] = useState<string | null>(null)
  const [pending, start]    = useTransition()

  async function handleRemove() {
    start(async () => {
      setError(null)
      const result = await removeOrderItemAction(item.id, orderId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <>
      {error && (
        <tr><td colSpan={5}><Alert variant="danger">{error}</Alert></td></tr>
      )}
      <tr className="border-b border-lz-border/50 transition-colors last:border-0 hover:bg-lz-surface/60">
        <td className="px-4 py-3">
          <p className="text-sm text-lz-text">{item.product_name}</p>
          <p className="font-mono text-xs text-lz-muted">{item.product_sku}</p>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm">{item.quantity}</td>
        <td className="px-4 py-3 text-right tabular-nums text-sm hidden sm:table-cell">
          {item.currency_code} {item.unit_price.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-lz-text">
          {item.currency_code} {item.line_total.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            disabled={pending}
            onClick={handleRemove}
            className="text-xs text-lz-muted transition-colors hover:text-lz-danger disabled:opacity-40"
          >
            {pending ? '…' : 'Quitar'}
          </button>
        </td>
      </tr>
    </>
  )
}

function AddItemForm({ orderId, products }: { orderId: string; products: ProductOption[] }) {
  const bound = addOrderItemAction.bind(null, orderId)
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(bound, undefined)
  const errors = state && 'errors' in state ? state.errors : {}
  const [selectedPrice, setSelectedPrice] = useState('')

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = products.find((p) => p.value === e.target.value)
    setSelectedPrice(p ? String(p.price) : '')
  }

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {'success' in (state ?? {}) && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          label="Producto"
          name="product_id"
          required
          options={[{ value: '', label: 'Seleccionar…' }, ...products]}
          onChange={handleProductChange}
          error={errors.product_id?.[0]}
        />
        <Input
          label="Cantidad"
          name="quantity"
          type="number"
          min={1}
          step={1}
          required
          placeholder="1"
          error={errors.quantity?.[0]}
        />
        <Input
          label="Precio unitario"
          name="unit_price"
          type="number"
          min={0}
          step={0.01}
          required
          value={selectedPrice}
          onChange={(e) => setSelectedPrice(e.target.value)}
          placeholder="0.00"
          error={errors.unit_price?.[0]}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Agregar producto
        </Button>
      </div>
    </form>
  )
}

export function OrderItemsManager({ orderId, items, products, currency, readOnly }: Props) {
  const subtotal  = items.reduce((a, i) => a + i.line_total, 0)
  const totalUnits = items.reduce((a, i) => a + i.quantity, 0)

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-lz-muted">Sin productos. Agrega al menos uno.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                {['Producto', 'Cant.', 'Precio unit.', 'Total', ''].map((h, i) => (
                  <th key={i} className={['px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted', i >= 1 ? 'text-right' : 'text-left', i === 2 ? 'hidden sm:table-cell' : ''].join(' ')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                readOnly
                  ? (
                    <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-sm text-lz-text">{item.product_name}</p>
                        <p className="font-mono text-xs text-lz-muted">{item.product_sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">{item.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm hidden sm:table-cell">{item.currency_code} {item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-lz-text">{item.currency_code} {item.line_total.toFixed(2)}</td>
                      <td />
                    </tr>
                  )
                  : <ItemRow key={item.id} item={item} orderId={orderId} />
              ))}
            </tbody>
            <tfoot className="border-t border-lz-border bg-lz-surface/50">
              <tr>
                <td className="px-4 py-2 text-xs text-lz-muted">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} · {totalUnits} uds.
                </td>
                <td colSpan={2} className="hidden sm:table-cell" />
                <td colSpan={1} className="sm:hidden" />
                <td className="px-4 py-2 text-right tabular-nums text-sm font-semibold text-lz-text">
                  {currency} {subtotal.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {!readOnly && (
        <div className="border-t border-lz-border/50 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lz-muted">Agregar producto</p>
          <AddItemForm orderId={orderId} products={products} />
        </div>
      )}
    </div>
  )
}
