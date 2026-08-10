import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/store/contact-form'

export const metadata: Metadata = {
  title:       'Contacto',
  description: 'Contáctanos por WhatsApp, correo o formulario. Atención personalizada en Lanz Technology — especialistas en drones DJI, cámaras y tecnología premium.',
  alternates:  { canonical: '/contact' },
  openGraph: {
    title:       'Contacto — Lanz Technology',
    description: 'Contáctanos por WhatsApp o correo. Asesoría experta en tecnología premium.',
    type:        'website',
  },
  twitter: {
    card:        'summary',
    title:       'Contacto — Lanz Technology',
    description: 'Contáctanos por WhatsApp o correo. Asesoría experta.',
  },
}

const waPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const waUrl   = `https://wa.me/${waPhone}`
const waMsg   = encodeURIComponent('Hola, tengo una consulta sobre sus productos.')

const CHANNELS = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.523 5.84L0 24l6.336-1.5C8.028 23.445 9.973 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.648-.51-5.168-1.395l-.37-.22-3.762.891.946-3.643-.242-.376C2.525 15.557 2 13.833 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
    label:    'WhatsApp',
    sublabel: 'Respuesta inmediata',
    href:     `${waUrl}?text=${waMsg}`,
    color:    'text-[#25D366]',
    border:   'hover:border-[#25D366]/40',
    external: true,
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
      </svg>
    ),
    label:    'Correo electrónico',
    sublabel: 'ventas@lanz.tech',
    href:     'mailto:ventas@lanz.tech',
    color:    'text-lz-primary',
    border:   'hover:border-lz-primary/40',
    external: false,
  },
]

const INFO = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    label:   'Ubicación',
    value:   'Caracas, Venezuela',
    subtext: 'Atención con cita previa',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    label:   'Horario',
    value:   'Lun — Vie · 9:00 AM – 6:00 PM',
    subtext: 'Sábados con cita previa',
  },
]

export default function ContactPage() {
  return (
    <div className="animate-page">
      {/* Header */}
      <section className="border-b border-lz-border bg-lz-surface/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lz-primary">Estamos aquí</p>
          <h1 className="mb-4 text-3xl font-bold text-lz-text sm:text-4xl">¿En qué podemos ayudarte?</h1>
          <p className="mx-auto max-w-xl text-base text-lz-muted">
            Contáctanos directamente. Nuestro equipo responde rápido y con asesoría real, sin bots.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {CHANNELS.map(ch => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.external ? '_blank' : undefined}
              rel={ch.external ? 'noreferrer' : undefined}
              className={[
                'group flex flex-col gap-5 rounded-2xl border border-lz-border bg-lz-surface p-8 transition-all duration-200',
                ch.border,
                'hover:shadow-[0_0_24px_rgba(123,47,255,0.08)]',
              ].join(' ')}
            >
              <span className={ch.color}>{ch.icon}</span>
              <div>
                <p className="font-semibold text-lz-text transition-colors group-hover:text-lz-accent">{ch.label}</p>
                <p className="mt-1 text-sm text-lz-muted">{ch.sublabel}</p>
              </div>
              <span className="text-xs font-medium text-lz-primary group-hover:underline">
                Contactar →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Info: location + hours */}
      <section className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {INFO.map(info => (
            <div key={info.label} className="flex items-start gap-4 rounded-2xl border border-lz-border bg-lz-surface px-6 py-5">
              <span className="mt-0.5 shrink-0 text-lz-primary">{info.icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-lz-muted">{info.label}</p>
                <p className="mt-1 font-medium text-lz-text">{info.value}</p>
                <p className="mt-0.5 text-xs text-lz-muted">{info.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-lz-primary">Formulario de contacto</p>
          <h2 className="text-xl font-bold text-lz-text">Escríbenos directamente</h2>
          <p className="mt-2 text-sm text-lz-muted">Te respondemos por correo a la brevedad.</p>
        </div>
        <ContactForm />
      </section>

      {/* FAQ link */}
      <section className="border-t border-lz-border">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-lz-text">¿Buscas una respuesta rápida?</p>
              <p className="mt-1 text-sm text-lz-muted">Revisa nuestra sección de preguntas frecuentes.</p>
            </div>
            <Link
              href="/faq"
              className="shrink-0 inline-flex h-10 items-center gap-2 rounded-xl border border-lz-border px-5 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
            >
              Ver preguntas frecuentes →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
