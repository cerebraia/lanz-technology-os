/**
 * Configuración centralizada de la tienda pública.
 * Importable desde Server y Client Components.
 * Valores sensibles deben usar NEXT_PUBLIC_ para ser accesibles en el cliente.
 */

export const STORE_CONFIG = {
  name:             'Lanz Technology',
  whatsappNumber:   process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  instagramUrl:     process.env.NEXT_PUBLIC_INSTAGRAM_URL    ?? 'https://www.instagram.com/lanztechnology/',
  tiktokUrl:        process.env.NEXT_PUBLIC_TIKTOK_URL       ?? 'https://www.tiktok.com/@lanztechnology',
  youtubeUrl:       process.env.NEXT_PUBLIC_YOUTUBE_URL      ?? 'https://www.youtube.com/@lanz_technology',
  timezone:         'America/Caracas' as const,
  country:          'VE' as const,
  currency:         'USD' as const,
  reservationHours: 24,
} as const

export type StoreConfig = typeof STORE_CONFIG
