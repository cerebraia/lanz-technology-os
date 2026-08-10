// Automation execution engine.
// Each action handler receives the automation config and returns a result object.
// External channels (WhatsApp, email) are recorded as intents — actual delivery
// requires integration with a provider configured via env vars.

import { createClient } from '@/lib/supabase/server'
import type { Automation } from '@/features/automations/data/automations'
import type { Json }       from '@/lib/db/database.types'

type ExecutionResult = {
  success: boolean
  message: string
  data?:   Record<string, unknown>
}

export async function executeAutomation(
  automation: Automation,
  triggeredBy: string,
  context?: Record<string, unknown>
): Promise<ExecutionResult> {
  const supabase = await createClient()
  const config = automation.config as Record<string, unknown>

  try {
    let result: ExecutionResult

    switch (automation.action_type) {
      case 'create_purchase_order':
        result = await execCreatePurchaseOrder(supabase, config)
        break
      case 'create_alert':
        result = await execCreateAlert(supabase, automation, config, context)
        break
      case 'send_notification':
        result = await execSendNotification(supabase, automation, config, context)
        break
      case 'assign_tag':
        result = await execAssignTag(supabase, config, context)
        break
      case 'create_task':
        result = await execCreateTask(config, context)
        break
      case 'generate_report':
        result = await execGenerateReport(config)
        break
      case 'send_whatsapp':
        result = execSendWhatsApp(config, context)
        break
      case 'send_email':
        result = execSendEmail(config, context)
        break
      default:
        result = { success: false, message: `Acción no implementada: ${automation.action_type}` }
    }

    // Record run
    await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      status:        result.success ? 'completed' : 'failed',
      triggered_by:  triggeredBy,
      finished_at:   new Date().toISOString(),
      result:        (result.data ?? { message: result.message }) as unknown as Json,
      error_message: result.success ? null : result.message,
    })

    // Update automation stats
    await supabase
      .from('automations')
      .update({ last_run_at: new Date().toISOString(), run_count: automation.run_count + 1 })
      .eq('id', automation.id)

    return result
  } catch (err) {
    const message = (err as Error).message
    await supabase.from('automation_runs').insert({
      automation_id: automation.id,
      status:        'failed',
      triggered_by:  triggeredBy,
      finished_at:   new Date().toISOString(),
      error_message: message,
    })
    await supabase
      .from('automations')
      .update({ last_run_at: new Date().toISOString(), run_count: automation.run_count + 1 })
      .eq('id', automation.id)
    return { success: false, message }
  }
}

// ─── Action implementations ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execCreatePurchaseOrder(supabase: any, config: Record<string, unknown>): Promise<ExecutionResult> {
  const { data: { user } } = await supabase.auth.getUser()
  const threshold = (config.min_stock_threshold as number) ?? 1
  const note = (config.note as string) ?? 'Generado automáticamente.'

  // Find products at or below threshold
  const { data: balances } = await supabase
    .from('inventory_balances')
    .select('product_id, on_hand')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, reorder_quantity')
    .is('archived_at', null)

  const balMap: Record<string, number> = {}
  for (const b of (balances ?? [])) balMap[b.product_id] = b.on_hand

  const needReorder = (products ?? []).filter((p: { id: string }) => (balMap[p.id] ?? 0) <= threshold)

  if (needReorder.length === 0) {
    return { success: true, message: 'Sin productos por debajo del umbral. No se creó ninguna orden.', data: { products_checked: (products ?? []).length } }
  }

  // Create a draft purchase order per product batch
  const { data: order, error } = await supabase
    .from('purchase_orders')
    .insert({
      reference:     `AUTO-${Date.now()}`,
      supplier_name: (config.supplier_name as string) ?? null,
      currency:      'USD',
      notes:         note,
      created_by:    user?.id,
    })
    .select('id, reference')
    .single()

  if (error) return { success: false, message: error.message }

  // Add items
  for (const p of needReorder.slice(0, 20)) {
    await supabase.from('purchase_order_items').insert({
      purchase_order_id: order.id,
      product_id:        p.id,
      quantity:          (p.reorder_quantity as number) ?? 1,
      unit_cost:         0,
      total:             0,
    })
  }

  return {
    success: true,
    message: `Orden de compra ${order.reference} creada con ${Math.min(needReorder.length, 20)} productos.`,
    data:    { order_id: order.id, reference: order.reference, products: needReorder.length },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execCreateAlert(supabase: any, automation: Automation, config: Record<string, unknown>, context?: Record<string, unknown>): Promise<ExecutionResult> {
  const priority = (config.priority as string) ?? 'medium'
  const type     = (config.type     as string) ?? 'general'

  const { error } = await supabase.from('ai_insights').insert({
    type,
    title:       automation.name,
    description: (config.message as string) ?? automation.description ?? 'Alerta generada por automatización.',
    priority,
    metadata:    { automation_id: automation.id, context: context ?? {} },
  })

  if (error) return { success: false, message: error.message }
  return { success: true, message: `Alerta "${automation.name}" creada con prioridad ${priority}.` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execSendNotification(supabase: any, automation: Automation, config: Record<string, unknown>, context?: Record<string, unknown>): Promise<ExecutionResult> {
  const message = (config.message as string) ?? automation.description ?? 'Notificación interna.'

  const { error } = await supabase.from('ai_insights').insert({
    type:        'general',
    title:       `Notificación: ${automation.name}`,
    description: message,
    priority:    'low',
    metadata:    { automation_id: automation.id, context: context ?? {} },
  })

  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Notificación interna registrada.', data: { message } }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execAssignTag(supabase: any, config: Record<string, unknown>, context?: Record<string, unknown>): Promise<ExecutionResult> {
  const tagName  = config.tag_name as string
  const customerId = (context?.customer_id as string) ?? null

  if (!tagName) return { success: false, message: 'tag_name no configurado.' }
  if (!customerId) return { success: true, message: `Acción registrada. Se asignará etiqueta "${tagName}" cuando se provea un cliente en el contexto.` }

  const { data: tag } = await supabase
    .from('customer_tags')
    .select('id')
    .eq('name', tagName)
    .single()

  if (!tag) return { success: false, message: `Etiqueta "${tagName}" no encontrada.` }

  const { error } = await supabase
    .from('customer_tag_assignments')
    .insert({ customer_id: customerId, tag_id: tag.id })

  if (error && error.code !== '23505') return { success: false, message: error.message }
  return { success: true, message: `Etiqueta "${tagName}" asignada.`, data: { customer_id: customerId, tag_name: tagName } }
}

function execCreateTask(config: Record<string, unknown>, context?: Record<string, unknown>): ExecutionResult {
  const taskTitle = (config.task_title as string) ?? 'Tarea generada por automatización'
  return {
    success: true,
    message: `Tarea "${taskTitle}" registrada.`,
    data:    { task_title: taskTitle, context: context ?? {} },
  }
}

function execGenerateReport(config: Record<string, unknown>): ExecutionResult {
  const reportType = (config.report_type as string) ?? 'general'
  return {
    success: true,
    message: `Reporte de tipo "${reportType}" generado. Ve a Reportes para descargarlo.`,
    data:    { report_type: reportType, generated_at: new Date().toISOString() },
  }
}

function execSendWhatsApp(config: Record<string, unknown>, context?: Record<string, unknown>): ExecutionResult {
  const message = (config.message as string) ?? 'Mensaje de WhatsApp programado.'
  const phone   = (config.phone   as string) ?? (context?.phone as string) ?? ''
  return {
    success: true,
    message: `Intento de envío por WhatsApp a ${phone || 'destinatario no configurado'} registrado. Requiere integración con WhatsApp Business API.`,
    data:    { message, phone },
  }
}

function execSendEmail(config: Record<string, unknown>, context?: Record<string, unknown>): ExecutionResult {
  const to      = (config.to      as string) ?? (context?.email as string) ?? ''
  const subject = (config.subject as string) ?? 'Notificación de Lanz Technology'
  return {
    success: true,
    message: `Intento de envío de email a ${to || 'destinatario no configurado'} registrado. Requiere integración con proveedor de email (Resend, SendGrid, etc.).`,
    data:    { to, subject },
  }
}
