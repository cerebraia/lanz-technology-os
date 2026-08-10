/**
 * Servicio de WhatsApp — Lanz Technology
 *
 * Construye mensajes y URLs para la integración comercial por WhatsApp.
 * No usa bots ni APIs externas. El mensaje lo envía el cliente manualmente.
 *
 * Reglas:
 * - No incluir IDs internos, costos, márgenes ni datos sensibles.
 * - El mensaje debe ser legible y corto.
 * - La URL se construye siempre aquí, nunca en componentes.
 */

const DELIVERY_LABELS: Record<string, string> = {
  pickup:   'Retiro acordado',
  local:    'Entrega local',
  national: 'Envío nacional',
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type WhatsAppOrderItem = {
  name:     string
  quantity: number
}

export type WhatsAppOrderData = {
  orderNumber:    string
  customerName:   string
  items:          WhatsAppOrderItem[]
  total:          number
  currency:       string
  deliveryMethod: string | null
  city:           string | null
  notes:          string | null
}

// ─── Construcción del mensaje ─────────────────────────────────────────────────

export function buildWhatsAppMessage(data: WhatsAppOrderData): string {
  const productLines = data.items
    .map(i => `• ${i.name} × ${i.quantity}`)
    .join('\n')

  const totalFormatted = data.total.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const delivery = data.deliveryMethod
    ? (DELIVERY_LABELS[data.deliveryMethod] ?? data.deliveryMethod)
    : null

  const lines: string[] = [
    'Hola, equipo de Lanz Technology.',
    '',
    'Acabo de registrar el pedido:',
    '',
    data.orderNumber,
    '',
    'Cliente:',
    '',
    data.customerName,
    '',
    'Productos:',
    '',
    productLines,
    '',
    'Total estimado:',
    '',
    `${totalFormatted} ${data.currency}`,
  ]

  if (delivery) {
    lines.push('', 'Modalidad:', '', delivery)
  }

  if (data.city) {
    lines.push('', 'Ciudad:', '', data.city)
  }

  if (data.notes) {
    lines.push('', 'Notas:', '', data.notes)
  }

  lines.push('', 'Quedo atento para coordinar el pago y la entrega.', '', 'Gracias.')

  return lines.join('\n')
}

// ─── Construcción de la URL ───────────────────────────────────────────────────

export function buildWhatsAppUrl(message: string, phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/**
 * Construye la URL completa de WhatsApp para un pedido.
 * Retorna null si no hay número configurado.
 */
export function buildOrderWhatsAppUrl(
  data:  WhatsAppOrderData,
  phone: string,
): string | null {
  if (!phone) return null
  const message = buildWhatsAppMessage(data)
  return buildWhatsAppUrl(message, phone)
}
