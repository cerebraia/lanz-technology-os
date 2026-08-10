'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createImportReceiptAction, type ReceiptActionState } from '@/features/imports/actions/receipt-actions'
import type { ExpectedProduct } from '@/features/imports/data/receipts'

type LocationOption = { value: string; label: string }

type Props = {
  importId:  string
  products:  ExpectedProduct[]
  locations: LocationOption[]
}

export function ReceiptNewForm({ importId, products, locations }: Props) {
  const boundAction = createImportReceiptAction.bind(null, importId)
  const [state, formAction, pending] = useActionState<ReceiptActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-6">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      {/* Cabecera */}
      <div className="space-y-4 rounded-xl border border-lz-border bg-lz-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">Información de la recepción</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Referencia"
            name="reference"
            required
            placeholder="REC-2026-001"
            hint="Identificador único de esta recepción."
            error={errors.reference?.[0]}
          />
          <Select
            label="Ubicación de destino"
            name="location_id"
            required
            options={locations}
            placeholder="Seleccionar ubicación"
            error={errors.location_id?.[0]}
          />
        </div>
        <Textarea
          label="Observaciones"
          name="notes"
          rows={2}
          placeholder="Notas sobre esta recepción (condición del envío, incidencias, etc.)."
        />
      </div>

      {/* Productos */}
      <div className="rounded-xl border border-lz-border bg-lz-surface">
        <div className="border-b border-lz-border px-5 py-4">
          <p className="text-sm font-semibold text-lz-text">Productos pendientes</p>
          <p className="mt-0.5 text-xs text-lz-muted">
            Ingresa la cantidad física recibida. Los dañados no entran al inventario disponible.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Esperado</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Ant. rec.</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Pendiente</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Recibido</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">Dañado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.product_id} className="border-b border-lz-border/50 last:border-0">
                  <input type="hidden" name={`expected_${product.product_id}`} value={product.expected_quantity} />
                  <input type="hidden" name={`prev_received_${product.product_id}`} value={product.previously_received_quantity} />

                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-lz-text">{product.product_name}</p>
                    <p className="font-mono text-xs text-lz-muted">{product.sku}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted">
                    {product.expected_quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted hidden sm:table-cell">
                    {product.previously_received_quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs font-medium text-lz-text">
                    {product.pending_quantity}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      name={`received_${product.product_id}`}
                      defaultValue={0}
                      min={0}
                      step={1}
                      className={[
                        'mx-auto block w-20 rounded-lg border bg-lz-bg px-2 py-1 text-center text-sm tabular-nums text-lz-text',
                        'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
                        errors[`received_${product.product_id}`] ? 'border-lz-danger' : 'border-lz-border',
                      ].join(' ')}
                    />
                    {errors[`received_${product.product_id}`] && (
                      <p className="mt-0.5 text-center text-[10px] text-lz-danger">
                        {errors[`received_${product.product_id}`]![0]}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <input
                      type="number"
                      name={`damaged_${product.product_id}`}
                      defaultValue={0}
                      min={0}
                      step={1}
                      className={[
                        'mx-auto block w-20 rounded-lg border bg-lz-bg px-2 py-1 text-center text-sm tabular-nums text-lz-text',
                        'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
                        errors[`damaged_${product.product_id}`] ? 'border-lz-danger' : 'border-lz-border',
                      ].join(' ')}
                    />
                    {errors[`damaged_${product.product_id}`] && (
                      <p className="mt-0.5 text-center text-[10px] text-lz-danger">
                        {errors[`damaged_${product.product_id}`]![0]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-lz-border px-5 py-4">
          <Button type="submit" loading={pending}>
            Crear recepción en borrador →
          </Button>
        </div>
      </div>
    </form>
  )
}
