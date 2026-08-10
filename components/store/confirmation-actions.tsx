'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { WhatsAppButton } from '@/components/store/whatsapp-button'
import { STORE_CONFIG } from '@/config/store'
import { trackCheckoutCompleted, trackWhatsAppClicked } from '@/lib/store/analytics'

// Clave compartida con CheckoutForm — debe coincidir exactamente
const SESSION_ORDER_KEY = 'lz_checkout_last_order'

type Props = {
  whatsAppUrl:  string | null
  orderNumber:  string
  /** Cuando true renderiza el panel fijo inferior (solo mobile) */
  mobileFixed?: boolean
}

export function ConfirmationActions({ whatsAppUrl, orderNumber, mobileFixed }: Props) {
  useEffect(() => {
    // Registrar evento de checkout completado
    trackCheckoutCompleted(orderNumber)

    // Limpiar la clave de recuperación: el usuario llegó a la confirmación
    try {
      sessionStorage.removeItem(SESSION_ORDER_KEY)
    } catch { /* sessionStorage no disponible */ }
  // Solo al montar — no debe re-ejecutarse si orderNumber cambia
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWhatsAppClick = () => {
    trackWhatsAppClicked(orderNumber)
  }

  // ── Versión fija inferior (solo mobile) ──────────────────────────────────────
  if (mobileFixed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-lz-border bg-lz-bg/95 p-4 backdrop-blur-sm lg:hidden">
        <WhatsAppButton
          href={whatsAppUrl}
          onClick={handleWhatsAppClick}
          fullWidth
          size="lg"
        />
        {!whatsAppUrl && (
          <p className="mt-2 text-center text-[10px] text-lz-muted">
            Número de WhatsApp no configurado — contacta a{' '}
            <strong>{STORE_CONFIG.name}</strong> directamente.
          </p>
        )}
      </div>
    )
  }

  // ── Versión desktop (columna derecha) ────────────────────────────────────────
  return (
    <div className="space-y-3">
      <WhatsAppButton
        href={whatsAppUrl}
        onClick={handleWhatsAppClick}
        fullWidth
        size="lg"
      />

      <Link
        href="/catalog"
        className="flex h-11 w-full items-center justify-center rounded-xl border border-lz-border text-sm text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
      >
        Seguir comprando
      </Link>

      {!whatsAppUrl && (
        <p className="text-center text-[10px] text-lz-muted">
          Número de WhatsApp no configurado —{' '}
          configura <code className="font-mono text-lz-primary">NEXT_PUBLIC_WHATSAPP_NUMBER</code>.
        </p>
      )}
    </div>
  )
}
