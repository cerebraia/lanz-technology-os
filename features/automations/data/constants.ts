export const TRIGGER_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  stock_low:         { label: 'Stock bajo',            icon: '📦', description: 'Se activa cuando un producto cae al mínimo' },
  order_created:     { label: 'Pedido creado',          icon: '🛒', description: 'Se activa al crear un nuevo pedido' },
  order_paid:        { label: 'Pedido pagado',          icon: '💳', description: 'Se activa cuando el pago es confirmado' },
  order_cancelled:   { label: 'Pedido cancelado',       icon: '❌', description: 'Se activa al cancelar un pedido' },
  import_received:   { label: 'Importación recibida',   icon: '🚢', description: 'Se activa cuando llega una importación' },
  payment_due:       { label: 'Pago vencido',           icon: '💸', description: 'Se activa cuando hay pagos vencidos' },
  customer_created:  { label: 'Nuevo cliente',          icon: '👤', description: 'Se activa al registrar un nuevo cliente' },
  campaign_finished: { label: 'Campaña terminada',      icon: '📣', description: 'Se activa al completar una campaña' },
  manual:            { label: 'Manual',                 icon: '▶️',  description: 'Ejecución solo manual' },
}

export const ACTION_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  create_purchase_order: { label: 'Crear orden de compra', icon: '📋', description: 'Genera un borrador de orden de compra' },
  send_notification:     { label: 'Enviar notificación',   icon: '🔔', description: 'Crea una alerta en el panel' },
  send_whatsapp:         { label: 'Enviar WhatsApp',       icon: '💬', description: 'Envía mensaje de WhatsApp' },
  send_email:            { label: 'Enviar email',          icon: '✉️',  description: 'Envía correo electrónico' },
  create_task:           { label: 'Crear tarea',           icon: '✅', description: 'Registra una tarea pendiente' },
  generate_report:       { label: 'Generar reporte',       icon: '📊', description: 'Genera y almacena un reporte' },
  create_alert:          { label: 'Crear alerta',          icon: '🚨', description: 'Genera una alerta en el módulo de IA' },
  assign_tag:            { label: 'Asignar etiqueta',      icon: '🏷️',  description: 'Asigna una etiqueta CRM al cliente' },
}

export const RUN_STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' }> = {
  pending:   { label: 'Pendiente',  variant: 'neutral'  },
  running:   { label: 'Ejecutando', variant: 'info'     },
  completed: { label: 'Completada', variant: 'success'  },
  failed:    { label: 'Fallida',    variant: 'danger'   },
}

export const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([value, { label }]) => ({ value, label }))
export const ACTION_OPTIONS  = Object.entries(ACTION_LABELS).map(([value, { label }]) => ({ value, label }))
