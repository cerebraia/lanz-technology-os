'use client'

import { useActionState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { createActivityNoteAction, type CrmActionState } from '@/features/crm/actions/crm-actions'

type Props = { customerId: string }

export function NoteForm({ customerId }: Props) {
  const action = createActivityNoteAction.bind(null, customerId)
  const [state, formAction, pending] = useActionState<CrmActionState, FormData>(action, undefined)
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-3">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      <Textarea
        label="Nueva nota"
        name="description"
        rows={2}
        required
        placeholder="Ej: Cliente confirmó interés en pedido al por mayor…"
        error={errors.description?.[0]}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>Guardar nota</Button>
      </div>
    </form>
  )
}
