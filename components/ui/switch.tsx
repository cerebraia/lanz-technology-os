'use client'

import type { InputHTMLAttributes } from 'react'

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: string
  hint?: string
}

export function Switch({ label, hint, id, className = '', ...props }: SwitchProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-3">
        <div className="relative shrink-0">
          <input
            type="checkbox"
            role="switch"
            id={inputId}
            className="peer sr-only"
            {...props}
          />
          {/* Track */}
          <div
            className={[
              'h-6 w-11 rounded-full border border-lz-border bg-lz-border/50 transition-colors',
              'peer-checked:border-lz-primary peer-checked:bg-lz-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-lz-primary/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-lz-bg',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className,
            ].join(' ')}
          />
          {/* Thumb */}
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-lz-muted shadow transition-all peer-checked:translate-x-5 peer-checked:bg-white" />
        </div>
        {label && (
          <span className="select-none text-sm text-lz-text">{label}</span>
        )}
      </label>
      {hint && <p className="pl-14 text-xs text-lz-muted">{hint}</p>}
    </div>
  )
}
