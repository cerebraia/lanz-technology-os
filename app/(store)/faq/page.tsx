import type { Metadata } from 'next'
import Link from 'next/link'
import { FaqAccordion } from '@/components/store/faq-accordion'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Resolvemos tus dudas sobre métodos de pago, envíos, garantía, devoluciones, productos DJI y más. Preguntas frecuentes de Lanz Technology.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title:       'Preguntas frecuentes — Lanz Technology',
    description: 'Todo lo que necesitas saber sobre productos DJI, envíos, garantía y más.',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'FAQ — Lanz Technology',
    description: 'Respuestas a las dudas más comunes sobre Lanz Technology.',
  },
}

const FAQ_SECTIONS = [
  {
    title: 'Métodos de pago',
    items: [
      {
        q: '¿Qué métodos de pago aceptan?',
        a: 'Aceptamos transferencias bancarias, pago móvil, Zelle y efectivo en dólares. Contáctanos para confirmar disponibilidad de métodos según tu ubicación.',
      },
      {
        q: '¿Puedo pagar en cuotas o financiado?',
        a: 'Por el momento no ofrecemos financiamiento directo. Sin embargo, si deseas coordinar un plan de pago puntual, contáctanos para evaluar opciones según el monto del pedido.',
      },
    ],
  },
  {
    title: 'Envíos',
    items: [
      {
        q: '¿Hacen envíos a todo el país?',
        a: 'Sí. Coordinamos envíos nacionales a través de las principales empresas de mensajería (MRW, Zoom, Tealca). Para el área de Caracas también ofrecemos entrega a domicilio el mismo día.',
      },
      {
        q: '¿Cuánto tiempo tarda en llegar mi pedido?',
        a: 'Caracas: mismo día o 24 horas. Ciudades principales (Valencia, Maracay, Barquisimeto, Maracaibo): 1 a 3 días hábiles. Resto del país: 3 a 7 días hábiles. Los tiempos son estimados y pueden variar.',
      },
      {
        q: '¿Cómo puedo rastrear mi pedido?',
        a: 'Una vez despachado, te enviamos el número de guía para que puedas rastrearlo en el sitio de la empresa de mensajería. También puedes consultarnos directamente por WhatsApp.',
      },
    ],
  },
  {
    title: 'Garantía',
    items: [
      {
        q: '¿Los productos tienen garantía?',
        a: 'Sí. Todos nuestros productos son originales y cuentan con garantía de fábrica. Los productos DJI incluyen la garantía oficial del fabricante.',
      },
      {
        q: '¿Qué cubre la garantía?',
        a: 'La garantía cubre defectos de fabricación y fallas de hardware bajo condiciones normales de uso. No cubre daños por caída, agua, modificaciones no autorizadas o desgaste normal. Consulta nuestra página de Garantías para todos los detalles.',
      },
      {
        q: '¿Cómo inicio un reclamo de garantía?',
        a: 'Contáctanos por WhatsApp o correo con tu número de pedido y una descripción del problema. Nuestro equipo técnico evalúa el caso y te guía en el proceso sin complicaciones.',
      },
    ],
  },
  {
    title: 'Devoluciones',
    items: [
      {
        q: '¿Puedo devolver un producto?',
        a: 'Aceptamos devoluciones dentro de los primeros 7 días naturales si el producto llega con un defecto de fábrica documentado. El producto debe estar en su empaque original y sin señales de uso indebido. Contáctanos para iniciar el proceso.',
      },
    ],
  },
  {
    title: 'Productos DJI',
    items: [
      {
        q: '¿Los productos DJI son originales?',
        a: 'Sí, todos los productos DJI que vendemos son 100% originales, importados legalmente. No trabajamos con réplicas ni productos de procedencia dudosa.',
      },
      {
        q: '¿Ofrecen soporte técnico para productos DJI?',
        a: 'Brindamos orientación técnica básica y te ayudamos a contactar al soporte oficial de DJI cuando es necesario. Para reparaciones fuera de garantía, trabajamos con técnicos especializados.',
      },
      {
        q: '¿Tienen accesorios y repuestos DJI?',
        a: 'Sí. Ofrecemos accesorios oficiales DJI: baterías, hélices, cargadores, fundas y más. Consulta el catálogo o pregúntanos si no encuentras lo que buscas.',
      },
    ],
  },
  {
    title: 'Disponibilidad y soporte',
    items: [
      {
        q: '¿Cómo sé si un producto está disponible?',
        a: 'Cada producto en el catálogo muestra su disponibilidad en tiempo real. Si el producto que buscas no está listado o aparece sin stock, escríbenos — podemos gestionarlo bajo pedido.',
      },
      {
        q: '¿Ofrecen asesoría antes de comprar?',
        a: 'Absolutamente. Contamos con un equipo que te guía para elegir el equipo más adecuado según tu presupuesto y uso. Contáctanos por WhatsApp antes de comprar, sin compromiso.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="border-b border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">Respuestas rápidas</p>
          <h1 className="mb-6 text-3xl font-bold text-lz-text sm:text-4xl">
            Preguntas frecuentes
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-lz-muted">
            Resolvemos las dudas más comunes. Si no encuentras lo que buscas, contáctanos directamente.
          </p>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-10">
          {FAQ_SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">
                {section.title}
              </h2>
              <FaqAccordion items={section.items} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lz-border">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-4 text-xl font-bold text-lz-text">¿No encontraste tu respuesta?</h2>
          <p className="mb-8 text-lz-muted">Nuestro equipo responde rápido y con información real.</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover">
              Contáctanos
            </Link>
            <Link href="/catalog" className="inline-flex h-11 items-center gap-2 rounded-xl border border-lz-border px-6 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text">
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
