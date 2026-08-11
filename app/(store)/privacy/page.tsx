import type { Metadata } from 'next'
import Link from 'next/link'
import { STORE_CONFIG } from '@/config/store'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Conoce cómo Lanz Technology recopila, usa y protege tus datos personales al usar nuestra tienda en línea.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title:       'Política de Privacidad — Lanz Technology',
    description: 'Transparencia total sobre el uso de tus datos personales en Lanz Technology.',
    type:        'website',
  },
}

const LAST_UPDATE = '05 de agosto de 2026'

const SECTIONS = [
  {
    id:    'responsable',
    title: '1. Responsable del tratamiento de datos',
    body: [
      'El responsable del tratamiento de los datos personales recabados a través de este sitio web es:',
      '**Lanz Technology**',
      'Correo de contacto: ventas@lanz.tech',
      'WhatsApp: +58 426-6540669',
      'Venezuela',
      'Para cualquier consulta relacionada con el tratamiento de tus datos, puedes contactarnos por los canales anteriores.',
    ],
  },
  {
    id:    'datos-recopilados',
    title: '2. Datos que recopilamos',
    body: [
      'Cuando utilizas nuestra tienda en línea podemos recopilar los siguientes datos:',
      '**Datos que nos proporcionas directamente:**\n• Nombre y apellido\n• Número de teléfono y WhatsApp\n• Correo electrónico (opcional)\n• Dirección de entrega (cuando aplica)\n• Número de cédula de identidad (opcional, para facturación)\n• Historial de pedidos y conversaciones de soporte',
      '**Datos recopilados automáticamente:**\n• Dirección IP\n• Tipo de navegador y dispositivo\n• Páginas visitadas y tiempo de sesión\n• Cookies técnicas necesarias para el funcionamiento del carrito',
      'No recopilamos datos bancarios, contraseñas ni información financiera directamente en nuestro sitio. Los pagos se coordinan de forma manual por WhatsApp o Zelle.',
    ],
  },
  {
    id:    'finalidad',
    title: '3. Finalidad del tratamiento',
    body: [
      'Utilizamos tus datos únicamente para:',
      '• Procesar y coordinar la entrega de tu pedido\n• Comunicarnos contigo para confirmar disponibilidad, precios y envío\n• Enviarte actualizaciones sobre el estado de tu pedido\n• Atender consultas de garantía y postventa\n• Mejorar la experiencia de navegación en nuestro sitio\n• Cumplir con obligaciones legales o regulatorias vigentes en Venezuela',
      'No utilizamos tus datos para fines publicitarios sin tu consentimiento expreso.',
    ],
  },
  {
    id:    'base-legal',
    title: '4. Base legal del tratamiento',
    body: [
      'El tratamiento de tus datos personales se sustenta en:',
      '• **Ejecución de un contrato:** cuando realizas un pedido, necesitamos tus datos para cumplir con la entrega.\n• **Consentimiento:** cuando nos proporcionas información adicional de forma voluntaria.\n• **Interés legítimo:** para mejorar nuestros servicios y prevenir fraudes.\n• **Cumplimiento legal:** cuando la ley venezolana nos obligue a conservar ciertos registros.',
    ],
  },
  {
    id:    'conservacion',
    title: '5. Conservación de datos',
    body: [
      'Conservamos tus datos personales durante el tiempo necesario para cumplir con las finalidades descritas y, en todo caso, durante los plazos legales aplicables en Venezuela.',
      '• Datos de pedidos: mínimo 5 años (obligación fiscal)\n• Datos de contacto: mientras mantengas relación comercial con nosotros\n• Cookies técnicas: sesión activa o según su expiración configurada',
      'Cuando tus datos ya no sean necesarios, los eliminaremos o los anonimizaremos de forma segura.',
    ],
  },
  {
    id:    'compartir',
    title: '6. Compartir datos con terceros',
    body: [
      'No vendemos ni cedemos tus datos personales a terceros con fines comerciales.',
      'Podemos compartir información estrictamente necesaria con:',
      '• **Empresas de mensajería (Zoom, MRW):** nombre, dirección y teléfono para coordinar la entrega.\n• **Proveedores técnicos (Supabase):** plataforma de base de datos segura donde se almacenan los pedidos. Los datos se alojan en servidores con cifrado en tránsito y reposo.\n• **Autoridades competentes:** únicamente cuando exista obligación legal o requerimiento judicial.',
      'Todos nuestros proveedores operan bajo acuerdos de confidencialidad y están obligados a proteger tus datos.',
    ],
  },
  {
    id:    'cookies',
    title: '7. Cookies',
    body: [
      'Nuestro sitio utiliza únicamente cookies técnicas esenciales para el funcionamiento del carrito de compras y la sesión de navegación.',
      'No usamos cookies de rastreo publicitario, ni de terceros como Google Ads o Meta Pixel.',
      '**Cookies utilizadas:**\n• `lz_cart`: almacena el contenido de tu carrito localmente en tu navegador (localStorage)\n• Cookies de sesión: gestión de autenticación (solo para usuarios del panel administrativo)',
      'Puedes eliminar las cookies en cualquier momento desde la configuración de tu navegador.',
    ],
  },
  {
    id:    'derechos',
    title: '8. Tus derechos',
    body: [
      'De conformidad con la Ley de Infogobierno y las normas aplicables en Venezuela, tienes derecho a:',
      '• **Acceso:** conocer qué datos tuyos tenemos registrados.\n• **Rectificación:** corregir datos inexactos o desactualizados.\n• **Eliminación:** solicitar el borrado de tus datos cuando ya no sean necesarios.\n• **Oposición:** oponerte al tratamiento de tus datos en determinadas circunstancias.\n• **Portabilidad:** recibir tus datos en un formato estructurado y legible.',
      'Para ejercer cualquiera de estos derechos, contáctanos por WhatsApp (+58 426-6540669) o al correo ventas@lanz.tech indicando tu nombre, el derecho que deseas ejercer y, si aplica, el número de pedido relacionado.',
      'Responderemos tu solicitud en un plazo máximo de 15 días hábiles.',
    ],
  },
  {
    id:    'seguridad',
    title: '9. Seguridad de los datos',
    body: [
      'Aplicamos medidas técnicas y organizativas para proteger tus datos personales frente a accesos no autorizados, pérdida o alteración:',
      '• Cifrado en tránsito (HTTPS/TLS) en todas las comunicaciones del sitio\n• Base de datos protegida con Row-Level Security (RLS) y acceso restringido por roles\n• Acceso al panel administrativo restringido por autenticación y permisos granulares\n• Revisiones periódicas de seguridad\n• Los datos de pago nunca se almacenan en nuestro sistema; los pagos se coordinan directamente por WhatsApp o Zelle',
      'Ningún sistema es 100% infalible. Si detectas alguna vulnerabilidad, te pedimos contactarnos de inmediato.',
    ],
  },
  {
    id:    'menores',
    title: '10. Menores de edad',
    body: [
      'Nuestra tienda no está dirigida a menores de 18 años. No recopilamos intencionalmente datos personales de menores.',
      'Si eres padre, madre o tutor y crees que un menor nos ha proporcionado datos personales, contáctanos para eliminarlos de nuestros registros.',
    ],
  },
  {
    id:    'cambios',
    title: '11. Cambios en esta política',
    body: [
      'Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en nuestras prácticas o en la legislación aplicable.',
      'Cuando hagamos cambios relevantes, publicaremos la versión actualizada en esta página con la nueva fecha de actualización. Te recomendamos revisarla periódicamente.',
      `Última actualización: ${LAST_UPDATE}`,
    ],
  },
  {
    id:    'contacto',
    title: '12. Contacto',
    body: [
      'Si tienes preguntas, comentarios o solicitudes relacionadas con esta Política de Privacidad, puedes contactarnos:',
      '• **WhatsApp:** +58 426-6540669\n• **Correo:** ventas@lanz.tech\n• **Formulario:** /contact',
      'Estamos comprometidos con la transparencia y responderemos todas tus consultas a la brevedad posible.',
    ],
  },
]

function parseBody(text: string) {
  // Bold (**text**) → <strong>
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-lz-text">{part}</strong>
      : part
  )
}

export default function PrivacyPage() {
  return (
    <div className="animate-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-lz-border bg-lz-surface/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-lz-primary/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-primary">Transparencia total</p>
          <h1 className="mb-6 text-3xl font-bold text-lz-text sm:text-4xl">
            Política de Privacidad
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-lz-muted">
            En Lanz Technology tratamos tus datos con responsabilidad y transparencia.
            Esta política explica qué información recopilamos, cómo la usamos y cuáles son tus derechos.
          </p>
          <p className="mt-4 text-sm text-lz-muted/70">
            Última actualización: {LAST_UPDATE}
          </p>
        </div>
      </section>

      {/* Índice */}
      <section className="border-b border-lz-border bg-lz-surface/60">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-lz-muted">Contenido</p>
          <nav aria-label="Secciones de la política de privacidad">
            <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-lz-muted transition-colors hover:text-lz-accent"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* Contenido */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-14">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="mb-6 text-xl font-bold text-lz-text">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.body.map((paragraph, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-line text-sm leading-relaxed text-lz-muted"
                  >
                    {parseBody(paragraph)}
                  </p>
                ))}
              </div>
              <div className="mt-8 border-b border-lz-border/50" />
            </div>
          ))}
        </div>

        {/* Nota final */}
        <div className="mt-14 rounded-2xl border border-lz-border bg-lz-surface p-6">
          <p className="text-center text-sm leading-relaxed text-lz-muted">
            Esta política ha sido redactada de buena fe para informarte sobre el uso de tus datos.
            No somos abogados y esta no constituye asesoría legal. Si tienes dudas específicas,
            te recomendamos consultar con un experto en protección de datos.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lz-border">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="mb-4 text-xl font-bold text-lz-text">¿Tienes alguna pregunta?</h2>
          <p className="mb-8 text-lz-muted">
            Nuestro equipo está disponible para aclarar cualquier duda sobre el uso de tus datos.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-lz-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-lz-primary-hover"
            >
              Contactar
            </Link>
            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-lz-border px-6 text-sm font-medium text-lz-muted transition-all hover:border-lz-primary/40 hover:text-lz-text"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
