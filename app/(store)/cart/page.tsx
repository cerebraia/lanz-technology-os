import type { Metadata } from 'next'
import Link from 'next/link'
import { CartItems } from '@/components/store/cart-items'

export const metadata: Metadata = {
  title:       'Tu carrito',
  description: 'Revisa tus productos antes de continuar con tu pedido.',
  robots:      'noindex', // carrito no debe indexarse
}

export default function CartPage() {
  return (
    <div className="animate-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-lz-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-lz-text transition-colors">Inicio</Link>
        <span aria-hidden>/</span>
        <Link href="/catalog" className="hover:text-lz-text transition-colors">Catálogo</Link>
        <span aria-hidden>/</span>
        <span className="text-lz-text">Tu carrito</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-lz-text sm:text-3xl">Tu carrito</h1>
        <p className="mt-1 text-sm text-lz-muted">Revisa tus productos antes de continuar.</p>
      </div>

      <CartItems />
    </div>
  )
}
