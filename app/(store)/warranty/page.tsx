import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Garantías',
  description: 'Conoce las condiciones de garantía de Lanz Technology. Productos originales DJI con cobertura de fábrica y proceso de reclamo transparente.',
  alternates: { canonical: '/warranty' },
  openGraph: {
    title:       'Garantías — Lanz Technology',
    description: 'Productos originales DJI con garantía de fábrica. Proceso de reclamo claro y tiempos definidos.',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Garantías — Lanz Technology',
    description: 'Garantía oficial DJI. Conoce cobertura, exclusiones y procedimiento.',
  },
}

const COVERED = [
  'Drones DJI y accesorios originales',
  'Cámaras de acción GoPro y DJI Osmo',
  'Estabilizadores y gimbals',
  'Baterías y cargadores originales',
  'Controladores y transmisores',
  'Defectos de fabricación comprobables',
  'Fallas de hardware bajo uso normal',
]

const EXCLUDED = [
  'Daños por caída o impacto',
  'Exposición a agua o humedad (sin certificación IP)',
  'Desgaste normal por uso prolongado',
  'Modificaciones o reparaciones no autorizadas',
  'Daños por voltaje incorrecto o carga inadecuada',
  'Pérdida o robo del producto',
  'Daños cosméticos: arañazos, rayones',
]

const STEPS = [
  {
    n:    '01',
    title: 'Contáctanos',
    desc:  'Escríbenos por WhatsApp o correo con el número de pedido y descripción del problema.',
  },
  {
    n:    '02',
    title: 'Diagnóstico',
    desc:  'Nuestro equipo técnico evalúa el caso. Podemos solicitarte fotos o vídeos del defecto.',
  },
  {
    n:    '03',
    title: 'Envío o visita',
    desc:  'Si aplica garantía, coordinamos el envío del producto a nuestro centro de servicio.',
  },
  {
    n:    '04',
    title: 'Resolución',
    desc:  'Reparación, reposición o devolución según el diagnóstico. Te informamos en cada paso.',
  },
]

const TIMES = [
  { label: 'Diagnóstico inicial',     time: '3 – 5 días hábiles' },
  { label: 'Reparación en garantía',  time: '7 – 14 días hábiles' },
  { label: 'Reposición de producto',  time: '3 – 7 días hábiles' },
  { label: 'Devolución de dinero',    time: '5 – 10 días hábiles' },
]

export default function WarrantyPage() {
  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lz-border bg-lz-surface/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[350px] w-[350px] rounded-full bg-lz-primary/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">Compra con confianza</p>
          <h1 className="mb-6 text-3xl font-bold text-lz-text sm:text-4xl">
            Garantía en todos nuestros productos
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-lz-muted">
            Todos los productos que vendemos son originales y cuentan con garantía de fábrica. Si algo falla, estamos aquí para resolverlo sin complicaciones.
          </p>
        </div>
      </section>

      {/* Covered / Excluded */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Covered */}
          <div className="rounded-2xl border border-lz-border bg-lz-surface p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lz-success/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lz-success" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h2 className="font-bold text-lz-text">Qué cubre la garantía</h2>
            </div>
            <ul className="space-y-3">
              {COVERED.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-lz-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lz-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Excluded */}
          <div className="rounded-2xl border border-lz-border bg-lz-surface p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lz-danger/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lz-danger" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
              <h2 className="font-bold text-lz-text">Qué no cubre</h2>
            </div>
            <ul className="space-y-3">
              {EXCLUDED.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-lz-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lz-danger/60" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Sin burocracia</p>
            <h2 className="text-2xl font-bold text-lz-text">Procedimiento de reclamo</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(step => (
              <div key={step.n} className="rounded-2xl border border-lz-border bg-lz-surface p-6">
                <span className="mb-4 block font-mono text-2xl font-bold text-lz-primary/40">{step.n}</span>
                <p className="mb-2 font-semibold text-lz-text">{step.title}</p>
                <p className="text-sm leading-relaxed text-lz-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Times */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Transparencia total</p>
          <h2 className="text-2xl font-bold text-lz-text">Tiempos estimados</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-lz-border">
          {TIMES.map((row, i) => (
            <div
              key={row.label}
              className={[
                'flex items-center justify-between px-6 py-4',
                i < TIMES.length - 1 ? 'border-b border-lz-border' : '',
                i % 2 === 0 ? 'bg-lz-surface' : 'bg-lz-surface/50',
              ].join(' ')}
            >
              <span className="text-sm text-lz-muted">{row.label}</span>
              <span className="text-sm font-semibold text-lz-text">{row.time}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-lz-muted">
          Los tiempos son estimados y pueden variar según la disponibilidad de repuestos y el proveedor.
        </p>
      </section>

      {/* CTA */}
      <section className="border-t border-lz-border">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-4 text-xl font-bold text-lz-text">¿Necesitas iniciar un reclamo?</h2>
          <p className="mb-8 text-lz-muted">Contáctanos directamente. Respondemos rápido y sin rodeos.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover">
              Contactar soporte
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
