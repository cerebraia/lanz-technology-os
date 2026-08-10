import type { Metadata } from 'next'
import { CheckoutForm }     from '@/components/store/checkout-form'
import { CheckoutProgress } from '@/components/store/checkout-progress'

export const metadata: Metadata = {
  title:  'Finalizar pedido',
  robots: 'noindex',
}

export default function CheckoutPage() {
  return (
    <div className="animate-page mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-5">
        <CheckoutProgress current="checkout" />

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-lz-primary">
            Checkout
          </p>
          <h1 className="text-2xl font-bold text-lz-text sm:text-3xl">Finalizar pedido</h1>
          <p className="mt-2 text-sm text-lz-muted">
            Completa tus datos para registrar la solicitud y continuar la coordinación con Lanz Technology.
          </p>
        </div>
      </div>

      <CheckoutForm />
    </div>
  )
}
