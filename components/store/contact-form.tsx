'use client'

import { useState } from 'react'

type FormState = 'idle' | 'success'

export function ContactForm() {
  const [state,   setState]   = useState<FormState>('idle')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="rounded-2xl border border-lz-success/30 bg-lz-success/10 p-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lz-success/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lz-success" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mb-2 font-semibold text-lz-text">Mensaje recibido</h3>
        <p className="text-sm text-lz-muted">
          Gracias por contactarnos. Te responderemos a la brevedad.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="cf-name" className="mb-1.5 block text-xs font-medium text-lz-muted">
          Nombre
        </label>
        <input
          id="cf-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre completo"
          className="block w-full rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm text-lz-text placeholder:text-lz-muted/50 transition-colors focus:border-lz-primary/50 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="cf-email" className="mb-1.5 block text-xs font-medium text-lz-muted">
          Correo electrónico
        </label>
        <input
          id="cf-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="block w-full rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm text-lz-text placeholder:text-lz-muted/50 transition-colors focus:border-lz-primary/50 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-xs font-medium text-lz-muted">
          Mensaje
        </label>
        <textarea
          id="cf-message"
          required
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="¿En qué podemos ayudarte?"
          className="block w-full resize-none rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm text-lz-text placeholder:text-lz-muted/50 transition-colors focus:border-lz-primary/50 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="h-11 w-full rounded-xl bg-lz-primary text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
      >
        Enviar mensaje
      </button>
    </form>
  )
}
