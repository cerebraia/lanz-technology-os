'use client'

import { useActionState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { TRIGGER_OPTIONS, ACTION_OPTIONS } from '@/features/automations/data/constants'
import { createAutomationAction, type AutomationActionState } from '@/features/automations/actions/automation-actions'

export function AutomationForm() {
  const [state, formAction, pending] = useActionState<AutomationActionState, FormData>(
    createAutomationAction, undefined
  )
  const errors = state && 'errors' in state ? state.errors : {}

  return (
    <form action={formAction} className="space-y-5">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}

      <Input
        label="Nombre"
        name="name"
        required
        placeholder="Ej: Reposición de stock crítico"
        error={errors.name?.[0]}
      />

      <Textarea
        label="Descripción"
        name="description"
        rows={2}
        placeholder="Qué hace esta automatización y cuándo se activa."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Trigger (evento)"
          name="trigger_type"
          required
          options={TRIGGER_OPTIONS}
          error={errors.trigger_type?.[0]}
        />
        <Select
          label="Acción"
          name="action_type"
          required
          options={ACTION_OPTIONS}
          error={errors.action_type?.[0]}
        />
      </div>

      <Textarea
        label="Configuración (JSON)"
        name="config"
        rows={4}
        defaultValue="{}"
        placeholder={'{\n  "priority": "high",\n  "message": "Alerta personalizada"\n}'}
        error={errors.config?.[0]}
      />

      <p className="text-xs text-lz-muted">
        El JSON de configuración acepta parámetros específicos de cada acción (priority, message, tag_name, report_type, etc.).
      </p>

      <div className="flex justify-end border-t border-lz-border pt-4">
        <Button type="submit" loading={pending}>Crear automatización</Button>
      </div>
    </form>
  )
}
