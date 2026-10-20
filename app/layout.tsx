import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import Script from 'next/script'
import { CartProvider } from '@/lib/store/cart'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lanz.tech'
const GA_ID    = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

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
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}
    </html>
  )
}
