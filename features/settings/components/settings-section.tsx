'use client'

import { useActionState } from 'react'
import { saveSettingsAction, type SettingsState } from '@/features/settings/actions/settings-actions'
import type { SettingKey } from '@/features/settings/data/settings'

type Field = {
  key:         SettingKey
  label:       string
  type?:       'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select'
  placeholder?: string
  options?:    { value: string; label: string }[]
  hint?:       string
}

type Props = {
  title:    string
  fields:   Field[]
  defaults: Record<string, string>
}

export function SettingsSection({ title, fields, defaults }: Props) {
  const keys = fields.map(f => f.key)
  const action = saveSettingsAction.bind(null, keys)

  const [state, formAction, pending] = useActionState<SettingsState, FormData>(action, undefined)

  return (
    <section className="rounded-xl border border-lz-border bg-lz-surface">
      {/* Header */}
      <div className="border-b border-lz-border px-5 py-4">
        <h2 className="text-sm font-semibold text-lz-text">{title}</h2>
      </div>

      <form action={formAction} className="p-5">
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label htmlFor={`s-${f.key}`} className="mb-1.5 block text-xs font-medium text-lz-muted">
                {f.label}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  id={`s-${f.key}`}
                  name={f.key}
                  rows={4}
                  defaultValue={defaults[f.key] ?? ''}
                  placeholder={f.placeholder}
                  className="block w-full resize-y rounded-xl border border-lz-border bg-lz-bg px-4 py-3 text-sm text-lz-text placeholder:text-lz-muted/50 focus:border-lz-primary/50 focus:outline-none transition-colors"
                />
              ) : f.type === 'select' && f.options ? (
                <select
                  id={`s-${f.key}`}
                  name={f.key}
                  defaultValue={defaults[f.key] ?? ''}
                  className="block w-full rounded-xl border border-lz-border bg-lz-bg px-4 py-3 text-sm text-lz-text focus:border-lz-primary/50 focus:outline-none transition-colors"
                >
                  {f.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={`s-${f.key}`}
                  name={f.key}
                  type={f.type ?? 'text'}
                  defaultValue={defaults[f.key] ?? ''}
                  placeholder={f.placeholder}
                  className="block w-full rounded-xl border border-lz-border bg-lz-bg px-4 py-3 text-sm text-lz-text placeholder:text-lz-muted/50 focus:border-lz-primary/50 focus:outline-none transition-colors"
                />
              )}

              {f.hint && (
                <p className="mt-1 text-[11px] text-lz-muted">{f.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* Feedback */}
        {state?.error && (
          <p className="mt-3 rounded-lg border border-lz-danger/30 bg-lz-danger/10 px-3 py-2 text-xs text-lz-danger">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="mt-3 rounded-lg border border-lz-success/30 bg-lz-success/10 px-3 py-2 text-xs text-lz-success">
            Guardado correctamente.
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-xl bg-lz-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-lz-primary-hover disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  )
}
