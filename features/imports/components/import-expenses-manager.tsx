'use client'

import { useActionState, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  addImportExpenseAction,
  removeImportExpenseAction,
  type ImportActionState,
} from '@/features/imports/actions/import-actions'
import { EXPENSE_CONCEPT_LABELS } from '@/features/imports/data/constants'
import type { ImportExpense } from '@/features/imports/data/imports'

const CONCEPT_OPTIONS = Object.entries(EXPENSE_CONCEPT_LABELS).map(([value, label]) => ({ value, label }))

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'VES', label: 'VES' },
]

type Props = {
  importId:  string
  expenses:  ImportExpense[]
  editable:  boolean
}

function ExpenseRow({
  expense,
  importId,
  editable,
}: {
  expense:  ImportExpense
  importId: string
  editable: boolean
}) {
  const [error,   setError] = useState<string | null>(null)
  const [pending, start]    = useTransition()

  async function handleRemove() {
    start(async () => {
      setError(null)
      const result = await removeImportExpenseAction(expense.id, importId)
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
      <tr className="border-b border-lz-border/50 last:border-0">
        <td className="px-4 py-3 text-sm text-lz-text">
          {EXPENSE_CONCEPT_LABELS[expense.concept] ?? expense.concept}
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
          {expense.currency} {expense.amount.toFixed(2)}
        </td>
        <td className="px-4 py-3 text-xs text-lz-muted hidden sm:table-cell">
          {expense.notes ?? '—'}
        </td>
        {editable && (
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
        )}
      </tr>
    </>
  )
}

function AddExpenseForm({ importId }: { importId: string }) {
  const boundAction = addImportExpenseAction.bind(null, importId)
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    boundAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {state && 'success' in state && <Alert variant="success">{state.message}</Alert>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          label="Concepto"
          name="concept"
          required
          options={CONCEPT_OPTIONS}
          placeholder="Seleccionar concepto"
          error={errors.concept?.[0]}
        />
        <Input
          label="Monto"
          name="amount"
          type="number"
          min={0.01}
          step={0.01}
          required
          placeholder="0.00"
          error={errors.amount?.[0]}
        />
        <Select
          label="Moneda"
          name="currency"
          required
          options={CURRENCY_OPTIONS}
          defaultValue="USD"
        />
      </div>
      <Input
        label="Notas"
        name="notes"
        placeholder="Descripción opcional del gasto."
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Registrar gasto
        </Button>
      </div>
    </form>
  )
}

export function ImportExpensesManager({ importId, expenses, editable }: Props) {
  const total = expenses.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <p className="text-sm text-lz-muted">Sin gastos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lz-border">
          <table className="w-full text-sm">
            <thead className="border-b border-lz-border bg-lz-sidebar">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Concepto</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Monto</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Notas</th>
                {editable && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <ExpenseRow key={exp.id} expense={exp} importId={importId} editable={editable} />
              ))}
            </tbody>
            <tfoot className="border-t border-lz-border bg-lz-surface/50">
              <tr>
                <td className="px-4 py-2 text-xs text-lz-muted">
                  {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-sm font-semibold text-lz-text">
                  USD {total.toFixed(2)}
                </td>
                <td colSpan={editable ? 2 : 1} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editable && (
        <div className="border-t border-lz-border/50 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Agregar gasto
          </p>
          <AddExpenseForm importId={importId} />
        </div>
      )}
    </div>
  )
}
