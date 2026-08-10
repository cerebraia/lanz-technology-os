import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Nosotros',
  description: 'Conoce a Lanz Technology: tu aliado en tecnología de drones, cámaras y equipos premium. Distribuidores oficiales DJI con experiencia de compra transparente.',
  alternates:  { canonical: '/about' },
  openGraph: {
    title:       'Nosotros — Lanz Technology',
    description: 'Conoce a Lanz Technology: tu aliado en tecnología de drones, cámaras y equipos premium.',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Nosotros — Lanz Technology',
    description: 'Tu aliado en tecnología de drones, cámaras y equipos premium.',
  },
}

const VALUES = [
  { icon: '🚀', title: 'Innovación', desc: 'Traemos lo último en tecnología aérea y de imagen al mercado.' },
  { icon: '🛡️', title: 'Confianza', desc: 'Productos originales con garantía, sin intermediarios.' },
  { icon: '🤝', title: 'Asesoría real', desc: 'Te acompañamos antes y después de tu compra.' },
  { icon: '⚡', title: 'Rapidez', desc: 'Respuesta inmediata y procesos sin complicaciones.' },
]

export default function AboutPage() {
  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lz-border bg-lz-surface/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-lz-primary/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">Nuestra historia</p>
          <h1 className="mb-6 text-3xl font-bold text-lz-text sm:text-4xl">
            Acercamos la tecnología premium a quienes la sueñan
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-lz-muted">
            Lanz Technology nació de la pasión por la tecnología de drones y fotografía aérea. Hoy somos el destino de confianza para pilotos, creadores de contenido y profesionales que exigen lo mejor.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-primary">Misión</p>
            <h2 className="mb-4 text-xl font-bold text-lz-text">Tecnología al alcance de quienes crean</h2>
            <p className="leading-relaxed text-lz-muted">
              Democratizar el acceso a equipos de alta gama — drones, cámaras, estabilizadores y accesorios — ofreciendo productos originales, asesoría honesta y un proceso de compra transparente.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-primary">Visión</p>
            <h2 className="mb-4 text-xl font-bold text-lz-text">Ser el aliado tecnológico de la región</h2>
            <p className="leading-relaxed text-lz-muted">
              Construir la comunidad de creadores y pilotos más grande del país, conectando personas con herramientas que amplían lo que pueden crear, explorar y comunicar.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Lo que nos define</p>
            <h2 className="text-2xl font-bold text-lz-text">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(v => (
              <div key={v.title} className="rounded-2xl border border-lz-border bg-lz-surface p-6">
                <span className="mb-4 block text-3xl">{v.icon}</span>
                <p className="mb-2 font-semibold text-lz-text">{v.title}</p>
                <p className="text-sm leading-relaxed text-lz-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DJI Specialization */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-primary">Nuestra especialidad</p>
            <h2 className="mb-4 text-xl font-bold text-lz-text">Especialistas en DJI</h2>
            <p className="mb-4 leading-relaxed text-lz-muted">
              DJI es el fabricante líder mundial de drones y tecnología de imagen aérea. Somos distribuidores con experiencia directa en la línea completa: Mavic, Mini, Air, Avata, Osmo, Ronin y accesorios.
            </p>
            <p className="leading-relaxed text-lz-muted">
              Conocemos cada producto en profundidad. Eso nos permite asesorarte con honestidad: te recomendamos lo que realmente necesitas, no el modelo más caro.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-primary">Calidad garantizada</p>
            <h2 className="mb-4 text-xl font-bold text-lz-text">Compromiso con la originalidad</h2>
            <p className="mb-4 leading-relaxed text-lz-muted">
              No vendemos réplicas ni productos de procedencia dudosa. Cada artículo que ofrecemos es original, importado legalmente y con la documentación de garantía de fábrica correspondiente.
            </p>
            <p className="leading-relaxed text-lz-muted">
              Si algo falla, respondemos. Nuestro proceso de garantía es transparente, sin letras pequeñas ni excusas.
            </p>
          </div>
        </div>
      </section>

      {/* Shopping experience */}
      <section className="border-t border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Sin complicaciones</p>
            <h2 className="text-2xl font-bold text-lz-text">Una experiencia de compra diferente</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Elige con confianza',
                desc: 'Catálogo actualizado con información técnica real. Si tienes dudas, te asesoramos antes de decidir.',
              },
              {
                step: '02',
                title: 'Paga de forma segura',
                desc: 'Múltiples métodos de pago. Confirmamos tu pedido antes de procesar cualquier cargo.',
              },
              {
                step: '03',
                title: 'Recibe y disfruta',
                desc: 'Empacamos con cuidado y coordinamos el envío más conveniente según tu zona.',
              },
            ].map(s => (
              <div key={s.step} className="rounded-2xl border border-lz-border bg-lz-surface p-6">
                <span className="mb-4 block font-mono text-2xl font-bold text-lz-primary/40">{s.step}</span>
                <p className="mb-2 font-semibold text-lz-text">{s.title}</p>
                <p className="text-sm leading-relaxed text-lz-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h2 className="mb-4 text-2xl font-bold text-lz-text">¿Tienes alguna pregunta?</h2>
        <p className="mb-8 text-lz-muted">Estamos aquí para ayudarte. Contáctanos directamente.</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover">
            Contáctanos
          </Link>
          <Link href="/catalog" className="inline-flex h-11 items-center gap-2 rounded-xl border border-lz-border px-6 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text">
            Ver catálogo
          </Link>
        </div>
      </section>
    </div>
  )
}
