import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata: Metadata = {
  title: 'Iniciar sesión — Lanz Technology OS',
  robots: 'noindex, nofollow',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08060F] px-6 py-12">
      {/* Glow de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
      >
        <div className="mt-[-10%] h-[500px] w-[500px] rounded-full bg-[#7B2FFF]/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logotipo / identidad */}
        <div className="mb-8 text-center">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.3em] text-[#7B2FFF] uppercase">
            Lanz Technology
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8F8FF]">
            Centro de operaciones
          </h1>
          <p className="mt-1 text-xs text-[#A8A3B8]">
            Acceso exclusivo para usuarios internos
          </p>
        </div>

        {/* Card del formulario */}
        <div className="rounded-2xl border border-[#2A2438] bg-[#140A28]/60 p-6 backdrop-blur-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
