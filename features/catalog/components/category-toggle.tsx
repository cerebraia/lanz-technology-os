'use client'

import { useOptimistic, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { toggleCategoryActiveAction } from '@/features/catalog/actions/category-actions'

type CategoryToggleProps = {
  id: string
  isActive: boolean
}

export function CategoryToggle({ id, isActive }: CategoryToggleProps) {
  const [optimisticActive, setOptimistic] = useOptimistic(
    isActive,
    (_: boolean, next: boolean) => next
  )
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked
    startTransition(async () => {
      setOptimistic(next)
      await toggleCategoryActiveAction(id, next)
    })
  }

  return (
    <Switch
      checked={optimisticActive}
      onChange={handleChange}
      disabled={pending}
      aria-label={optimisticActive ? 'Desactivar categoría' : 'Activar categoría'}
    />
  )
}
