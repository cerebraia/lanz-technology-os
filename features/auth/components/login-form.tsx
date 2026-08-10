'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/features/auth/actions/sign-in'

export function LoginForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(signIn, undefined)

  useEffect(() => {
    if (state && 'success' in state) {
      router.push(state.redirectTo)
    }
  }, [state, router])

  if (state && 'success' in state) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-sm text-[#A8A3B8]">Redirigiendo…</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.field === 'general' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-[#F8F8FF]">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="block w-full rounded-lg border border-[#2A2438] bg-[#171522] px-3 py-2.5 text-sm text-[#F8F8FF] placeholder-[#A8A3B8] focus:border-[#7B2FFF]/60 focus:outline-none focus:ring-2 focus:ring-[#7B2FFF]/30 disabled:opacity-50"
          placeholder="correo@lanz.technology"
          aria-describedby={state?.field === 'email' ? 'email-error' : undefined}
        />
        {state?.field === 'email' && (
          <p id="email-error" className="text-xs text-red-400">{state.error}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-[#F8F8FF]">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="block w-full rounded-lg border border-[#2A2438] bg-[#171522] px-3 py-2.5 text-sm text-[#F8F8FF] placeholder-[#A8A3B8] focus:border-[#7B2FFF]/60 focus:outline-none focus:ring-2 focus:ring-[#7B2FFF]/30 disabled:opacity-50"
          placeholder="••••••••"
          aria-describedby={state?.field === 'password' ? 'password-error' : undefined}
        />
        {state?.field === 'password' && (
          <p id="password-error" className="text-xs text-red-400">{state.error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#7B2FFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9A4DFF] focus:outline-none focus:ring-2 focus:ring-[#7B2FFF]/50 focus:ring-offset-2 focus:ring-offset-[#08060F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
