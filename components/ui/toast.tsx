'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  info:    'border-lz-primary/40 bg-lz-surface text-lz-accent',
  success: 'border-lz-success/30 bg-lz-surface text-lz-success',
  warning: 'border-lz-warning/30 bg-lz-surface text-lz-warning',
  danger:  'border-lz-danger/30  bg-lz-surface text-lz-danger',
}

const icons: Record<ToastVariant, string> = {
  info:    '○',
  success: '✓',
  warning: '⚠',
  danger:  '✕',
}

function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-lz-toast',
        variantClasses[item.variant],
      ].join(' ')}
    >
      <span className="shrink-0 text-base leading-none" aria-hidden="true">
        {icons[item.variant]}
      </span>
      <span className="flex-1 text-lz-text">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Cerrar notificación"
        className="ml-2 shrink-0 rounded p-0.5 text-lz-muted opacity-60 transition-opacity hover:opacity-100"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = `toast-${++counter.current}`
      setToasts((prev) => [...prev, { id, message, variant, duration }])
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[80] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastEntry key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
