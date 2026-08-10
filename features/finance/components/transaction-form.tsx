'use client'

import { useActionState, useState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import {
  TX_INCOME_CATEGORIES,
  TX_EXPENSE_CATEGORIES,
  TX_OTHER_CATEGORIES,
  CURRENCY_OPTIONS,
} from '@/features/finance/data/constants'
import { createTransactionAction, type FinanceActionState } from '@/features/finance/actions/finance-actions'

const TYPE_OPTIONS = [
  { value: 'income',     label: 'Ingreso' },
  { value: 'expense',    label: 'Egreso' },
  { value: 'adjustment', label: 'Ajuste' },
  { value: 'transfer',   label: 'Transferencia' },
]

type Props = { accountOptions: { value: string; label: string }[] }

export function TransactionForm({ accountOptions }: Props) {
  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(
    createTransactionAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}
  const [txType, setTxType] = useState('income')

  const categoryMap =
    txType === 'income'  ? TX_INCOME_CATEGORIES  :
    txType === 'expense' ? TX_EXPENSE_CATEGORIES :
    TX_OTHER_CATEGORIES

  const categoryOptions = Object.entries(categoryMap).map(([value, label]) => ({ value, label }))

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo"
          name="type"
          required
          options={TYPE_OPTIONS}
          defaultValue="income"
          onChange={(e) => setTxType((e.target as HTMLSelectElement).value)}
          error={errors.type?.[0]}
        />
        <Select
          label="Categoría"
          name="category"
          required
          options={categoryOptions}
          defaultValue={categoryOptions[0]?.value}
          error={errors.category?.[0]}
        />
      </div>

      <Input
        label="Descripción"
        name="description"
        required
        placeholder="Descripción del movimiento"
        error={errors.description?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <Input
          label="Fecha"
          name="transaction_date"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <Select
        label="Cuenta"
        name="account_id"
        options={accountOptions}
        defaultValue=""
      />

      <Textarea
        label="Notas"
        name="notes"
        rows={2}
        placeholder="Notas opcionales."
      />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>Registrar movimiento</Button>
      </div>
    </form>
  )
}
