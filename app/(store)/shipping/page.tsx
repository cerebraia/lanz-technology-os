import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Envíos',
  description: 'Información sobre envíos de Lanz Technology. Zonas de cobertura, modalidades de entrega, tiempos aproximados y recomendaciones para recibir tu producto en perfectas condiciones.',
  alternates: { canonical: '/shipping' },
  openGraph: {
    title:       'Envíos — Lanz Technology',
    description: 'Enviamos a todo el país. Conoce modalidades, tiempos y cobertura.',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Envíos — Lanz Technology',
    description: 'Cobertura nacional. Entrega a domicilio o retiro en punto.',
  },
}

const ZONES = [
  {
    zone:  'Caracas y área metropolitana',
    time:  'Mismo día o 24 horas',
    badge: 'Prioritario',
    color: 'text-lz-success bg-lz-success/10',
  },
  {
    zone:  'Ciudades principales (Valencia, Maracay, Barquisimeto, Maracaibo)',
    time:  '1 – 3 días hábiles',
    badge: 'Estándar',
    color: 'text-lz-primary bg-lz-primary/10',
  },
  {
    zone:  'Resto del país',
    time:  '3 – 7 días hábiles',
    badge: 'Nacional',
    color: 'text-lz-warning bg-lz-warning/10',
  },
]

const MODES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
      </svg>
    ),
    title: 'Delivery a domicilio',
    desc:  'Enviamos directamente a tu dirección mediante empresas de mensajería de confianza (MRW, Zoom, Tealca u otras según tu zona).',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    title: 'Retiro en punto',
    desc:  'Puedes retirar tu pedido personalmente coordinando una visita. Disponible en Caracas.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: 'Encomienda nacional',
    desc:  'Para localidades fuera del área metropolitana usamos encomiendas a través de las principales líneas de transporte.',
  },
]

const TIPS = [
  'Verifica que tu dirección esté completa antes de confirmar el pedido.',
  'Los equipos de vuelo se empacan con protección especial para evitar daños en tránsito.',
  'Si tu pedido incluye baterías LiPo, puede aplicar restricciones adicionales de transporte.',
  'Solicita el número de seguimiento para rastrear tu envío en tiempo real.',
  'En caso de recibir un paquete dañado externamente, documenta con fotos antes de abrirlo.',
]

export default function ShippingPage() {
  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lz-border bg-lz-surface/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-[350px] w-[350px] rounded-full bg-lz-primary/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">Cobertura nacional</p>
          <h1 className="mb-6 text-3xl font-bold text-lz-text sm:text-4xl">
            Envíos a todo el país
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-lz-muted">
            Coordinamos la entrega más conveniente según tu ubicación. Empacamos con cuidado para que tu equipo llegue en perfectas condiciones.
          </p>
        </div>
      </section>

      {/* Zones */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">¿Cuánto tarda?</p>
          <h2 className="text-2xl font-bold text-lz-text">Zonas de cobertura y tiempos</h2>
        </div>
        <div className="space-y-4">
          {ZONES.map(z => (
            <div key={z.zone} className="flex flex-col gap-3 rounded-2xl border border-lz-border bg-lz-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 sm:items-center">
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${z.color}`}>
                  {z.badge}
                </span>
                <p className="text-sm font-medium text-lz-text">{z.zone}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-lz-muted sm:text-right">{z.time}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-lz-muted">
          Los tiempos son estimados y pueden variar según la empresa de mensajería y condiciones externas.
        </p>
      </section>

      {/* Modes */}
      <section className="border-t border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Flexibilidad</p>
            <h2 className="text-2xl font-bold text-lz-text">Modalidades de entrega</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {MODES.map(m => (
              <div key={m.title} className="rounded-2xl border border-lz-border bg-lz-surface p-6">
                <span className="mb-4 block text-lz-primary">{m.icon}</span>
                <p className="mb-2 font-semibold text-lz-text">{m.title}</p>
                <p className="text-sm leading-relaxed text-lz-muted">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Para una entrega perfecta</p>
          <h2 className="text-2xl font-bold text-lz-text">Recomendaciones</h2>
        </div>
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-lz-border bg-lz-surface px-5 py-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lz-primary/15 text-[11px] font-bold text-lz-primary">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-lz-muted">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lz-border">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-4 text-xl font-bold text-lz-text">¿Tienes dudas sobre el envío?</h2>
          <p className="mb-8 text-lz-muted">Escríbenos y te damos información exacta para tu zona.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover">
              Consultar ahora
            </Link>
            <Link href="/faq" className="inline-flex h-11 items-center gap-2 rounded-xl border border-lz-border px-6 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text">
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
