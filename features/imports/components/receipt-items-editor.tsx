'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { updateReceiptItemsAction, type ReceiptActionState } from '@/features/imports/actions/receipt-actions'
import { getItemDerived } from '@/features/imports/data/constants'
import type { ImportReceiptItem } from '@/features/imports/data/receipts'

type Props = {
  receiptId: string
  importId:  string
  items:     ImportReceiptItem[]
}

export function ReceiptItemsEditor({ receiptId, importId, items }: Props) {
  const boundAction = updateReceiptItemsAction.bind(null, receiptId, importId)
  const [state, formAction, pending] = useActionState<ReceiptActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  const totals = items.reduce((acc, item) => {
    const { accepted, missing, excess } = getItemDerived(item)
    return {
      received: acc.received + item.received_quantity,
      damaged:  acc.damaged  + item.damaged_quantity,
      accepted: acc.accepted + accepted,
      missing:  acc.missing  + missing,
      excess:   acc.excess   + excess,
    }
  }, { received: 0, damaged: 0, accepted: 0, missing: 0, excess: 0 })

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {state && 'success' in state && <Alert variant="success">{state.message}</Alert>}

      <div className="overflow-x-auto rounded-lg border border-lz-border">
        <table className="w-full text-sm">
          <thead className="border-b border-lz-border bg-lz-sidebar">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Producto</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Esperado</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Ant. rec.</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Pendiente</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Recibido</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">Dañado</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden lg:table-cell">Aceptado</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden lg:table-cell">Faltante</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { pending: pendingQty, accepted, missing } = getItemDerived(item)
              const errorReceived = errors[`received_item_${item.id}`]
              const errorDamaged  = errors[`damaged_item_${item.id}`]
              return (
                <tr key={item.id} className="border-b border-lz-border/50 last:border-0">
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-lz-text">{item.products?.name ?? '—'}</p>
                    <p className="font-mono text-xs text-lz-muted">{item.products?.sku ?? '—'}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted">
                    {item.expected_quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-muted hidden sm:table-cell">
                    {item.previously_received_quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs font-medium text-lz-text">
                    {pendingQty}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        name={`received_item_${item.id}`}
                        defaultValue={item.received_quantity}
                        min={0}
                        step={1}
                        className={[
                          'w-20 rounded-lg border bg-lz-bg px-2 py-1 text-center text-sm tabular-nums text-lz-text',
                          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
                          errorReceived ? 'border-lz-danger' : 'border-lz-border',
                        ].join(' ')}
                      />
                      {errorReceived && <span className="text-[10px] text-lz-danger">{errorReceived[0]}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        name={`damaged_item_${item.id}`}
                        defaultValue={item.damaged_quantity}
                        min={0}
                        step={1}
                        className={[
                          'w-20 rounded-lg border bg-lz-bg px-2 py-1 text-center text-sm tabular-nums text-lz-text',
                          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
                          errorDamaged ? 'border-lz-danger' : 'border-lz-border',
                        ].join(' ')}
                      />
                      {errorDamaged && <span className="text-[10px] text-lz-danger">{errorDamaged[0]}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-lz-success hidden lg:table-cell">
                    {accepted}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs hidden lg:table-cell">
                    <span className={missing > 0 ? 'text-lz-danger' : 'text-lz-muted'}>
                      {missing > 0 ? `-${missing}` : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t border-lz-border bg-lz-surface/50">
            <tr>
              <td className="px-3 py-2 text-xs text-lz-muted" colSpan={3}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </td>
              <td className="hidden sm:table-cell" />
              <td className="px-3 py-2 text-center tabular-nums text-sm font-semibold text-lz-text">
                {totals.received}
              </td>
              <td className="px-3 py-2 text-center tabular-nums text-sm text-lz-muted hidden md:table-cell">
                {totals.damaged}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-sm text-lz-success hidden lg:table-cell">
                {totals.accepted}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-sm hidden lg:table-cell">
                <span className={totals.missing > 0 ? 'text-lz-danger' : 'text-lz-muted'}>
                  {totals.missing > 0 ? `-${totals.missing}` : '—'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Guardar cantidades
        </Button>
      </div>
    </form>
  )
}
