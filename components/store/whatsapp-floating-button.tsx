'use client'

import { STORE_CONFIG } from '@/config/store'

const WA_MESSAGE = encodeURIComponent(
  'Hola, equipo de Lanz Technology. Quiero recibir información sobre sus productos.'
)

function buildWaLink() {
  if (STORE_CONFIG.whatsappNumber) return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${WA_MESSAGE}`
  // Fallback: abre WhatsApp Web sin número específico
  return `https://web.whatsapp.com/`
}

export function WhatsAppFloatingButton() {
  // Siempre se muestra — el número se configura en NEXT_PUBLIC_WHATSAPP_NUMBER

  return (
    <a
      href={buildWaLink()}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Contactar a Lanz Technology por WhatsApp"
      title="Contactar por WhatsApp"
      className={[
        'fixed bottom-6 right-6 z-50',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full bg-[#25D366] text-white',
        'transition-transform duration-200',
        'hover:scale-110 active:scale-95',
        // safe-area para móviles con notch/barra de navegación
        'mb-[env(safe-area-inset-bottom,0px)]',
        // Entrada suave al cargar
        'animate-float-in',
        // Pulse sutil periódico (solo box-shadow, sin layout)
        'animate-wa-glow',
      ].join(' ')}
    >
      {/* WhatsApp icon */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-7 w-7"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    </a>
  )
}
