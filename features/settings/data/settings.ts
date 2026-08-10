import { createClient } from '@/lib/supabase/server'

export type BusinessSetting = {
  key:         string
  value:       string
  description: string | null
  updated_at:  string
}

// All recognized setting keys with their defaults and descriptions
export const SETTING_KEYS = {
  // Negocio
  business_name:     { default: 'Lanz Technology',     label: 'Nombre comercial' },
  business_email:    { default: '',                     label: 'Correo electrónico' },
  business_phone:    { default: '',                     label: 'Teléfono' },
  business_whatsapp: { default: '',                     label: 'Número WhatsApp' },
  business_address:  { default: '',                     label: 'Dirección' },
  // Redes sociales
  instagram_url:     { default: '',                     label: 'Instagram' },
  tiktok_url:        { default: '',                     label: 'TikTok' },
  youtube_url:       { default: '',                     label: 'YouTube' },
  // Operación
  default_currency:  { default: 'USD',                  label: 'Moneda predeterminada' },
  order_prefix:      { default: 'LT',                   label: 'Prefijo de pedido' },
  timezone:          { default: 'America/Caracas',       label: 'Zona horaria' },
  tax_rate:          { default: '0',                    label: 'Impuesto (%)' },
  // Políticas
  warranty_policy:   { default: '',                     label: 'Política de garantía' },
  shipping_policy:   { default: '',                     label: 'Política de envíos' },
  // Horario
  hours_weekdays:    { default: 'Lunes a Viernes: 9:00 AM – 6:00 PM', label: 'Días de semana' },
  hours_saturday:    { default: 'Sábado: con cita previa',            label: 'Sábados' },
  hours_sunday:      { default: 'Domingo: cerrado',                   label: 'Domingos' },
} as const

export type SettingKey = keyof typeof SETTING_KEYS

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('business_settings')
      .select('key, value')

    const map: Record<string, string> = {}
    for (const [key, meta] of Object.entries(SETTING_KEYS)) {
      map[key] = meta.default
    }
    for (const row of data ?? []) {
      map[row.key] = row.value
    }
    return map
  } catch {
    // Return defaults if DB is unavailable
    return Object.fromEntries(
      Object.entries(SETTING_KEYS).map(([k, v]) => [k, v.default])
    )
  }
}
