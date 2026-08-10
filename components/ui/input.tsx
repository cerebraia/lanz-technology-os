import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-lz-text">
          {label}
          {props.required && <span className="ml-1 text-lz-accent">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'block w-full rounded-lg border bg-lz-surface px-3 py-2 text-sm',
          'text-lz-text placeholder-lz-muted transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-lz-danger/60 focus:border-lz-danger'
            : 'border-lz-border focus:border-lz-primary/60',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && <p className="text-xs text-lz-muted">{hint}</p>}
      {error && <p className="text-xs text-lz-danger">{error}</p>}
    </div>
  )
}
