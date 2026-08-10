'use client'

import { useActionState, useState, useMemo } from 'react'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { ALLOCATION_METHOD_LABELS } from '@/features/imports/data/constants'
import { createAllocationAction, type CostActionState } from '@/features/imports/actions/cost-actions'
import type { ProductForAllocation } from '@/features/imports/data/costs'

const METHOD_OPTIONS = Object.entries(ALLOCATION_METHOD_LABELS).map(([value, label]) => ({
  value, label,
}))

type Props = {
  importId:        string
  products:        ProductForAllocation[]
  totalLogistics:  number
}

function computeAllocations(
  products: ProductForAllocation[],
  totalLogistics: number,
  method: string,
  manualAmounts: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>()

  if (method === 'quantity') {
    const totalQty = products.reduce((acc, p) => acc + p.received_quantity, 0)
    for (const p of products) {
      result.set(p.product_id, totalQty > 0
        ? (p.received_quantity / totalQty) * totalLogistics
        : 0
      )
    }
  } else if (method === 'value') {
    const totalValue = products.reduce((acc, p) => acc + p.merchandise_total, 0)
    for (const p of products) {
      result.set(p.product_id, totalValue > 0
        ? (p.merchandise_total / totalValue) * totalLogistics
        : 0
      )
    }
  } else {
    // manual
    for (const p of products) {
      result.set(p.product_id, manualAmounts.get(p.product_id) ?? 0)
    }
  }

  return result
}

export function CostAllocator({ importId, products, totalLogistics }: Props) {
  const boundAction = createAllocationAction.bind(null, importId)
  const [state, formAction, pending] = useActionState<CostActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  const [method, setMethod]               = useState('quantity')
  const [manualAmounts, setManualAmounts] = useState<Map<string, number>>(new Map())

  const allocations = useMemo(
    () => computeAllocations(products, totalLogistics, method, manualAmounts),
    [products, totalLogistics, method, manualAmounts]
  )

  const totalAllocated = [...allocations.values()].reduce((a, b) => a + b, 0)
  const difference     = totalLogistics - totalAllocated
  const balanceOk      = Math.abs(difference) < 0.01

  return (
    <form action={formAction} className="space-y-6">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      {/* Método + notas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Método de distribución"
          name="allocation_method"
          required
          options={METHOD_OPTIONS}
          defaultValue="quantity"
          onChange={(e) => setMethod((e.target as HTMLSelectElement).value)}
          error={errors.allocation_method?.[0]}
        />
        <Textarea
          label="Observaciones"
          name="notes"
          rows={2}
          placeholder="Notas sobre esta distribución (opcional)."
        />
      </div>

      {/* Hidden: total a distribuir */}
      <input type="hidden" name="total_amount" value={totalLogistics.toFixed(2)} />

      {/* Balance indicator */}
      {method === 'manual' && (
        <Alert variant={balanceOk ? 'success' : 'warning'}>
          {balanceOk
            ? 'La distribución manual está equilibrada.'
            : `Diferencia sin asignar: USD ${Math.abs(difference).toFixed(2)} ${difference > 0 ? '(falta distribuir)' : '(excede el total)'}`}
        </Alert>
      )}

      {/* Products table */}
      <div className="overflow-x-auto rounded-lg border border-lz-border">
        <table className="w-full text-sm">
          <thead className="border-b border-lz-border bg-lz-sidebar">
            <tr>
              <th className="px-3 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
              <th className="px-3 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted">Unidades</th>
              <th className="px-3 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Costo unit. merch.</th>
              <th className="px-3 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">Total merch.</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Logística asignada</th>
              <th className="px-3 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted hidden lg:table-cell">Costo unit. final</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const allocated  = allocations.get(product.product_id) ?? 0
              const finalUnit  = product.unit_merchandise_cost + (product.received_quantity > 0 ? allocated / product.received_quantity : 0)

              return (
                <tr key={product.product_id} className="border-b border-lz-border/50 last:border-0">
                  {/* Hidden fields for submission */}
                  <input type="hidden" name={`qty_${product.product_id}`}       value={product.received_quantity} />
                  <input type="hidden" name={`unit_merch_${product.product_id}`} value={product.unit_merchandise_cost.toFixed(4)} />

                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-lz-text">{product.product_name}</p>
                    <p className="font-mono text-xs text-lz-muted">{product.sku}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-lz-text">
                    {product.received_quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted hidden sm:table-cell">
                    {product.unit_merchandise_cost.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted hidden md:table-cell">
                    {product.merchandise_total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    {method === 'manual' ? (
                      <input
                        type="number"
                        name={`alloc_${product.product_id}`}
                        value={manualAmounts.get(product.product_id) ?? 0}
                        min={0}
                        step={0.01}
                        onChange={(e) => {
                          const next = new Map(manualAmounts)
                          next.set(product.product_id, parseFloat(e.target.value) || 0)
                          setManualAmounts(next)
                        }}
                        className="mx-auto block w-24 rounded-lg border border-lz-border bg-lz-bg px-2 py-1 text-center text-sm tabular-nums text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
                      />
                    ) : (
                      <>
                        <input type="hidden" name={`alloc_${product.product_id}`} value={allocated.toFixed(4)} />
                        <p className="text-center tabular-nums text-sm font-medium text-lz-accent">
                          {allocated.toFixed(2)}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-lz-text hidden lg:table-cell">
                    {finalUnit.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t border-lz-border bg-lz-surface/50">
            <tr>
              <td className="px-3 py-2 text-xs text-lz-muted" colSpan={2}>
                {products.length} productos
              </td>
              <td className="hidden sm:table-cell" />
              <td className="px-3 py-2 text-right tabular-nums text-xs text-lz-muted hidden md:table-cell">
                USD {products.reduce((a, p) => a + p.merchandise_total, 0).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center tabular-nums text-sm font-semibold text-lz-accent">
                USD {totalAllocated.toFixed(2)}
              </td>
              <td className="hidden lg:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button
          type="submit"
          loading={pending}
          disabled={method === 'manual' && !balanceOk}
        >
          Confirmar distribución
        </Button>
      </div>
    </form>
  )
}
