import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSettings }      from '@/features/settings/data/settings'
import { SettingsSection }  from '@/features/settings/components/settings-section'
import { PageHeader }       from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  await verifySession()
  const canRead = await checkPermission('settings.read')
  if (!canRead) redirect('/admin')

  const settings = await getSettings()

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Configuración del negocio"
        description="Administra la información comercial, operativa y de contacto de Lanz Technology."
        breadcrumbs={[
          { label: 'Dashboard',      href: '/admin' },
          { label: 'Configuración' },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Información general */}
        <SettingsSection
          title="Información del negocio"
          defaults={settings}
          fields={[
            {
              key:         'business_name',
              label:       'Nombre comercial',
              placeholder: 'Lanz Technology',
              hint:        'Aparece en facturas, correos y la tienda.',
            },
            {
              key:         'business_email',
              label:       'Correo electrónico',
              type:        'email',
              placeholder: 'ventas@lanz.tech',
            },
            {
              key:         'business_phone',
              label:       'Teléfono',
              type:        'tel',
              placeholder: '+58 412 000 0000',
            },
            {
              key:         'business_whatsapp',
              label:       'Número WhatsApp',
              type:        'tel',
              placeholder: '58412XXXXXXX',
              hint:        'Solo dígitos, sin + ni espacios. Ej: 584120000000',
            },
            {
              key:         'business_address',
              label:       'Dirección',
              placeholder: 'Caracas, Venezuela',
            },
          ]}
        />

        {/* Redes sociales */}
        <SettingsSection
          title="Redes sociales"
          defaults={settings}
          fields={[
            {
              key:         'instagram_url',
              label:       'Instagram',
              type:        'url',
              placeholder: 'https://instagram.com/lanztechnology',
            },
            {
              key:         'tiktok_url',
              label:       'TikTok',
              type:        'url',
              placeholder: 'https://tiktok.com/@lanztechnology',
            },
            {
              key:         'youtube_url',
              label:       'YouTube',
              type:        'url',
              placeholder: 'https://youtube.com/@lanztechnology',
            },
          ]}
        />

        {/* Operación */}
        <SettingsSection
          title="Operación"
          defaults={settings}
          fields={[
            {
              key:     'default_currency',
              label:   'Moneda predeterminada',
              type:    'select',
              options: [
                { value: 'USD', label: 'USD — Dólar estadounidense' },
                { value: 'VES', label: 'VES — Bolívar soberano' },
              ],
            },
            {
              key:         'order_prefix',
              label:       'Prefijo de pedido',
              placeholder: 'LT',
              hint:        'Se usa en el número de pedido. Ej: LT-00001',
            },
            {
              key:     'timezone',
              label:   'Zona horaria',
              type:    'select',
              options: [
                { value: 'America/Caracas',    label: 'America/Caracas (VET −4)' },
                { value: 'America/Bogota',     label: 'America/Bogota (COT −5)' },
                { value: 'America/New_York',   label: 'America/New_York (EST/EDT)' },
                { value: 'America/Mexico_City', label: 'America/Mexico_City (CST/CDT)' },
              ],
            },
            {
              key:         'tax_rate',
              label:       'Impuesto (%)',
              placeholder: '0',
              hint:        'IVA u otro impuesto sobre ventas. Dejar en 0 si no aplica.',
            },
          ]}
        />

        {/* Horario de atención */}
        <SettingsSection
          title="Horario de atención"
          defaults={settings}
          fields={[
            {
              key:         'hours_weekdays',
              label:       'Lunes a viernes',
              placeholder: 'Lunes a Viernes: 9:00 AM – 6:00 PM',
            },
            {
              key:         'hours_saturday',
              label:       'Sábados',
              placeholder: 'Sábado: con cita previa',
            },
            {
              key:         'hours_sunday',
              label:       'Domingos',
              placeholder: 'Domingo: cerrado',
            },
          ]}
        />

        {/* Política de garantía */}
        <SettingsSection
          title="Política de garantía"
          defaults={settings}
          fields={[
            {
              key:         'warranty_policy',
              label:       'Texto de la política',
              type:        'textarea',
              placeholder: 'Todos nuestros productos cuentan con garantía oficial de fábrica…',
              hint:        'Aparece en la página /warranty y comunicaciones al cliente.',
            },
          ]}
        />

        {/* Política de envíos */}
        <SettingsSection
          title="Política de envíos"
          defaults={settings}
          fields={[
            {
              key:         'shipping_policy',
              label:       'Texto de la política',
              type:        'textarea',
              placeholder: 'Realizamos envíos a todo el país mediante empresas de mensajería…',
              hint:        'Aparece en la página /shipping y comunicaciones al cliente.',
            },
          ]}
        />

      </div>
    </div>
  )
}
