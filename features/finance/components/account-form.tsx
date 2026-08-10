'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { ACCOUNT_TYPE_LABELS, CURRENCY_OPTIONS } from '@/features/finance/data/constants'
import { createAccountAction, updateAccountAction, type FinanceActionState } from '@/features/finance/actions/finance-actions'
import type { FinancialAccount } from '@/features/finance/data/accounts'

const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({ value, label }))

type Props = {
  account?: FinancialAccount
  submitLabel?: string
}

export function AccountForm({ account, submitLabel }: Props) {
  const action = account
    ? updateAccountAction.bind(null, account.id)
    : createAccountAction

  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre de la cuenta"
          name="name"
          required
          defaultValue={account?.name ?? ''}
          placeholder="Caja principal, Banco Mercantil…"
          error={errors.name?.[0]}
        />
        <Select
          label="Tipo"
          name="type"
          required
          options={TYPE_OPTIONS}
          defaultValue={account?.type ?? 'cash'}
          error={errors.type?.[0]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Moneda"
          name="currency"
          required
          options={CURRENCY_OPTIONS}
          defaultValue={account?.currency ?? 'USD'}
        />
        <Input
          label="Saldo inicial"
          name="balance"
          type="number"
          step={0.01}
          defaultValue={account?.balance ?? 0}
          placeholder="0.00"
          error={errors.balance?.[0]}
        />
      </div>

      <Textarea
        label="Notas"
        name="notes"
        rows={2}
        defaultValue={account?.notes ?? ''}
        placeholder="Información adicional (banco, número de cuenta, etc.)."
      />

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>
          {submitLabel ?? (account ? 'Guardar cambios' : 'Crear cuenta')}
        </Button>
      </div>
    </form>
  )
}
