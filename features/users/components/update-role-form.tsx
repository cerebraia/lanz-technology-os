'use client'

import { useActionState } from 'react'
import { Select }  from '@/components/ui/select'
import { Button }  from '@/components/ui/button'
import { Alert }   from '@/components/ui/alert'
import { updateUserRoleAction, type UserActionState } from '@/features/users/actions/user-actions'
import { ROLE_OPTIONS, type UserRole } from '@/features/users/data/constants'

type Props = {
  userId:      string
  currentRole: UserRole
}

export function UpdateRoleForm({ userId, currentRole }: Props) {
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    updateUserRoleAction,
    undefined
  )

  const errors  = state && 'errors' in state ? state.errors : {}
  const success = state && 'success' in state

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="user_id" value={userId} />
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {success && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}
      <Select
        label="Rol asignado"
        name="role"
        options={ROLE_OPTIONS}
        defaultValue={currentRole}
        error={errors.role?.[0]}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          Guardar rol
        </Button>
      </div>
    </form>
  )
}
