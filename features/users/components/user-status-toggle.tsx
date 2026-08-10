'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toggleUserStatusAction } from '@/features/users/actions/user-actions'

type Props = {
  userId: string
  status: 'active' | 'inactive'
}

export function UserStatusToggle({ userId, status }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()

  function handle() {
    start(async () => {
      setError(null)
      const result = await toggleUserStatusAction(
        userId,
        status === 'active' ? 'inactive' : 'active'
      )
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant={status === 'active' ? 'ghost' : 'secondary'}
        loading={pending}
        onClick={handle}
      >
        {status === 'active' ? 'Desactivar' : 'Activar'}
      </Button>
      {error && <p className="text-xs text-lz-danger">{error}</p>}
    </div>
  )
}
