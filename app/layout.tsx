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
    default:  'Lanz Technology — Drones, Cámaras y Tecnología Premium',
  },
  description:
    'Tienda oficial de Lanz Technology. Drones DJI, cámaras, estabilizadores y accesorios premium. Envíos a todo el país.',
  keywords: [
    'Lanz Technology',
    'DJI Venezuela',
    'drones DJI',
    'cámaras',
    'tecnología premium',
    'drones Venezuela',
    'accesorios DJI',
    'estabilizadores',
  ],
  openGraph: {
    siteName:    'Lanz Technology',
    type:        'website',
    locale:      'es_VE',
    title:       'Lanz Technology — Drones, Cámaras y Tecnología Premium',
    description: 'Tienda oficial de Lanz Technology. Drones DJI, cámaras y accesorios premium.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Lanz Technology — Drones, Cámaras y Tecnología Premium',
    description: 'Tienda oficial de Lanz Technology. Drones DJI, cámaras y accesorios premium.',
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
