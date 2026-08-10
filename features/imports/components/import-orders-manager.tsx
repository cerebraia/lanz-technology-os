'use client'

import { useActionState, useState, useTransition } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  addImportOrderAction,
  removeImportOrderAction,
  type ImportActionState,
} from '@/features/imports/actions/import-actions'
import type { ImportPurchaseOrder } from '@/features/imports/data/imports'
import { PURCHASE_STATUS_LABELS } from '@/features/purchases/data/constants'
import { Badge } from '@/components/ui/badge'

type ProductOption = { value: string; label: string }

type Props = {
  importId:      string
  linkedOrders:  ImportPurchaseOrder[]
  availableOrders: ProductOption[]
  editable:      boolean
}

function LinkedOrderRow({
  link,
  importId,
  editable,
}: {
  link:     ImportPurchaseOrder
  importId: string
  editable: boolean
}) {
  const [error,   setError] = useState<string | null>(null)
  const [pending, start]    = useTransition()
  const po = link.purchase_orders

  async function handleRemove() {
    start(async () => {
      setError(null)
      const result = await removeImportOrderAction(link.id, importId)
      if (result.error) setError(result.error)
    })
  }

  const statusDef = PURCHASE_STATUS_LABELS[po?.status ?? '']
  const supplierName = po?.suppliers?.name ?? po?.supplier_name

  return (
    <>
      {error && (
        <tr>
          <td colSpan={4}>
            <Alert variant="danger">{error}</Alert>
          </td>
        </tr>
      )}
      <tr className="border-b border-lz-border/50 last:border-0">
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-lz-text">{po?.reference ?? '—'}</p>
          {supplierName && (
            <p className="mt-0.5 text-xs text-lz-muted">{supplierName}</p>
          )}
        </td>
        <td className="px-4 py-3">
          {statusDef && (
            <Badge variant={statusDef.variant}>{statusDef.label}</Badge>
          )}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
          {po ? `${po.currency} ${po.subtotal.toFixed(2)}` : '—'}
        </td>
        {editable && (
          <td className="px-4 py-3 text-right">
            <button
              type="button"
              disabled={pending}
              onClick={handleRemove}
              className="text-xs text-lz-muted transition-colors hover:text-lz-danger disabled:opacity-40"
            >
              {pending ? '…' : 'Desvincular'}
            </button>
          </td>
        )}
      </tr>
    </>
  )
}

function AddOrderForm({ importId, available }: { importId: string; available: ProductOption[] }) {
  const boundAction = addImportOrderAction.bind(null, importId)
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  if (available.length === 0) {
    return (
      <p className="text-xs text-lz-muted">
        No hay órdenes disponibles. Solo se pueden vincular órdenes en estado Enviada o Recibida parcialmente sin importación asignada.
      </p>
    )
  }

  return (
    <form action={formAction} className="flex items-end gap-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {state && 'success' in state && <Alert variant="success">{state.message}</Alert>}
      <div className="flex-1">
        <Select
          label="Orden de compra"
          name="purchase_order_id"
          required
          options={available}
          placeholder="Seleccionar orden"
          error={errors.purchase_order_id?.[0]}
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        Vincular
      </Button>
    </form>
  )
}

export function ImportOrdersManager({ importId, linkedOrders, availableOrders, editable }: Props) {
  const total = linkedOrders.reduce((acc, o) => acc + (o.purchase_orders?.subtotal ?? 0), 0)

  return (
    <div className="space-y-4">
      {linkedOrders.length === 0 ? (
        <p className="text-sm text-lz-muted">Sin órdenes vinculadas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Orden</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Estado</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Subtotal</th>
                {editable && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {linkedOrders.map((link) => (
                <LinkedOrderRow key={link.id} link={link} importId={importId} editable={editable} />
              ))}
            </tbody>
            <tfoot className="border-t border-lz-border bg-lz-surface/50">
              <tr>
                <td colSpan={editable ? 2 : 1} className="px-4 py-2 text-xs text-lz-muted">
                  {linkedOrders.length} {linkedOrders.length === 1 ? 'orden' : 'órdenes'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-sm font-semibold text-lz-text">
                  USD {total.toFixed(2)}
                </td>
                {editable && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editable && (
        <div className="border-t border-lz-border/50 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Vincular orden de compra
          </p>
          <AddOrderForm importId={importId} available={availableOrders} />
        </div>
      )}
    </div>
  )
}
