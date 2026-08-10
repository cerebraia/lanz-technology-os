'use client'

import { useActionState } from 'react'
import { Input }   from '@/components/ui/input'
import { Select }  from '@/components/ui/select'
import { Button }  from '@/components/ui/button'
import { Alert }   from '@/components/ui/alert'
import { inviteUserAction, type UserActionState } from '@/features/users/actions/user-actions'
import { ROLE_OPTIONS } from '@/features/users/data/constants'

export function InviteUserForm() {
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    inviteUserAction,
    undefined
  )

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  return (
    <form action={action} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {success && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Nombre completo"
          name="full_name"
          required
          placeholder="Ana García"
          error={errors.full_name?.[0]}
        />
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          required
          placeholder="ana@ejemplo.com"
          error={errors.email?.[0]}
        />
        <Select
          label="Rol"
          name="role"
          required
          placeholder="Seleccionar rol…"
          options={ROLE_OPTIONS}
          error={errors.role?.[0]}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          Invitar usuario
        </Button>
      </div>
    </form>
  )
}
