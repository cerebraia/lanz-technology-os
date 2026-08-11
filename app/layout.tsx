import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { CartProvider } from '@/lib/store/cart'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s — Lanz Technology',
    default:  'Lanz Technology | Productos DJI y Tecnología Premium en Venezuela',
  },
  description:
    'Encuentra productos DJI, cámaras, micrófonos, estabilizadores, accesorios y tecnología premium en Lanz Technology. Compra en Venezuela con atención personalizada, delivery gratis en Caracas y envíos nacionales.',
  keywords: [
    'Lanz Technology',
    'DJI Venezuela',
    'productos DJI Venezuela',
    'tienda DJI Venezuela',
    'cámaras DJI',
    'micrófonos DJI',
    'estabilizadores DJI',
    'accesorios DJI',
    'tecnología premium Venezuela',
    'equipos para creadores de contenido',
    'DJI Caracas',
  ],
  openGraph: {
    siteName:    'Lanz Technology',
    type:        'website',
    locale:      'es_VE',
    title:       'Lanz Technology | Productos DJI y Tecnología Premium',
    description: 'Productos DJI, cámaras, audio, estabilizadores, accesorios y tecnología premium en Venezuela.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Lanz Technology | Productos DJI y Tecnología Premium',
    description: 'Productos DJI, cámaras, audio, estabilizadores, accesorios y tecnología premium en Venezuela.',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
