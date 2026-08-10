'use client'

import { useActionState } from 'react'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert }  from '@/components/ui/alert'
import { createTagAction, type CrmActionState } from '@/features/crm/actions/crm-actions'

const PRESET_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6',
]

export function TagCreateFormClient() {
  const [state, formAction, pending] = useActionState<CrmActionState, FormData>(
    createTagAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-4">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {'success' in (state ?? {}) && <Alert variant="success">{(state as { success: true; message: string }).message}</Alert>}

      <Input
        label="Nombre"
        name="name"
        required
        placeholder="Ej: VIP, Mayorista, Frecuente…"
        error={errors.name?.[0]}
      />

      <div>
        <p className="mb-1.5 text-xs font-medium text-lz-text">Color</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} className="sr-only" defaultChecked={c === '#6366f1'} />
              <span
                className="block h-7 w-7 rounded-full border-2 border-transparent ring-offset-1 ring-offset-lz-bg transition-all hover:ring-2 hover:ring-white/40 [input:checked+&]:ring-2 [input:checked+&]:ring-white [input:checked+&]:border-white"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" size="sm" loading={pending}>Crear etiqueta</Button>
      </div>
    </form>
  )
}
