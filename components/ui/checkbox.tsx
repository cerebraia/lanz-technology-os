'use client'

import type { InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  hint?: string
}

export function Checkbox({ label, error, hint, className = '', id, ...props }: CheckboxProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            id={inputId}
            className={[
              'peer h-4 w-4 cursor-pointer appearance-none rounded border bg-lz-surface transition-colors',
              'checked:border-lz-primary checked:bg-lz-primary',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-lz-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-lz-bg',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-lz-danger/60' : 'border-lz-border',
              className,
            ].join(' ')}
            {...props}
          />
          <svg
            className="pointer-events-none absolute inset-0 hidden h-4 w-4 text-white peer-checked:block"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8l3.5 3.5 6.5-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {label && (
          <span className="select-none text-sm leading-tight text-lz-text">{label}</span>
        )}
      </label>
      {hint && !error && <p className="pl-6 text-xs text-lz-muted">{hint}</p>}
      {error && <p className="pl-6 text-xs text-lz-danger">{error}</p>}
    </div>
  )
}
