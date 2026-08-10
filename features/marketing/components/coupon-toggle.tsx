'use client'

import { useState, useTransition } from 'react'
import { toggleCouponAction } from '@/features/marketing/actions/marketing-actions'

type Props = { couponId: string; isActive: boolean; canUpdate: boolean }

export function CouponToggle({ couponId, isActive, canUpdate }: Props) {
  const [active,  setActive] = useState(isActive)
  const [pending, start]     = useTransition()

  if (!canUpdate) {
    return (
      <span className={['text-xs font-medium', active ? 'text-lz-success' : 'text-lz-muted'].join(' ')}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    )
  }

  function handle() {
    start(async () => {
      const next = !active
      const result = await toggleCouponAction(couponId, next)
      if (!result.error) setActive(next)
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handle}
      className={[
        'text-xs font-medium transition-colors disabled:opacity-40',
        active ? 'text-lz-success hover:text-lz-danger' : 'text-lz-muted hover:text-lz-success',
      ].join(' ')}
    >
      {pending ? '…' : active ? 'Activo' : 'Inactivo'}
    </button>
  )
}
