'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import type { ImportStatus } from '@/features/imports/data/imports'

export type ImportActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// Status transition map: which statuses can follow each status
const ALLOWED_TRANSITIONS: Record<string, ImportStatus[]> = {
  planning:   ['purchased', 'cancelled'],
  purchased:  ['in_transit', 'cancelled'],
  in_transit: ['customs', 'cancelled'],
  customs:    ['received', 'cancelled'],
  received:   [],
  cancelled:  [],
}

// ─── createImportAction ───────────────────────────────────────────────────────

export async function createImportAction(
  _prev: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  try { await requirePermission('imports.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference           = (formData.get('reference')           as string)?.trim()
  const originCountry       = (formData.get('origin_country')       as string)?.trim()
  const destinationCountry  = (formData.get('destination_country')  as string)?.trim() || 'Venezuela'
  const shippingMethod      = (formData.get('shipping_method')      as string) || null
  const estimatedDeparture  = (formData.get('estimated_departure')  as string) || null
  const estimatedArrival    = (formData.get('estimated_arrival')    as string) || null
  const notes               = (formData.get('notes')                as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference)      errors.reference      = ['La referencia es obligatoria.']
  if (!originCountry)  errors.origin_country = ['El país de origen es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('imports')
    .insert({
      reference,
      origin_country: originCountry,
      destination_country: destinationCountry,
      shipping_method: shippingMethod || null,
      estimated_departure: estimatedDeparture || null,
      estimated_arrival: estimatedArrival || null,
      notes,
      created_by: user?.id,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { errors: { reference: ['Ya existe una importación con esa referencia.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/imports')
  redirect(`/admin/imports/${data.id}`)
}

// ─── updateImportAction ───────────────────────────────────────────────────────

export async function updateImportAction(
  importId: string,
  _prev: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  try { await requirePermission('imports.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference           = (formData.get('reference')           as string)?.trim()
  const originCountry       = (formData.get('origin_country')       as string)?.trim()
  const destinationCountry  = (formData.get('destination_country')  as string)?.trim() || 'Venezuela'
  const shippingMethod      = (formData.get('shipping_method')      as string) || null
  const estimatedDeparture  = (formData.get('estimated_departure')  as string) || null
  const estimatedArrival    = (formData.get('estimated_arrival')    as string) || null
  const notes               = (formData.get('notes')                as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference)      errors.reference      = ['La referencia es obligatoria.']
  if (!originCountry)  errors.origin_country = ['El país de origen es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('imports')
    .update({
      reference,
      origin_country: originCountry,
      destination_country: destinationCountry,
      shipping_method: shippingMethod || null,
      estimated_departure: estimatedDeparture || null,
      estimated_arrival: estimatedArrival || null,
      notes,
    })
    .eq('id', importId)

  if (error) {
    if (error.code === '23505') return { errors: { reference: ['Ya existe una importación con esa referencia.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/imports')
  revalidatePath(`/admin/imports/${importId}`)
  redirect(`/admin/imports/${importId}`)
}

// ─── changeImportStatusAction ─────────────────────────────────────────────────

export async function changeImportStatusAction(
  importId: string,
  newStatus: ImportStatus
): Promise<{ error?: string }> {
  const permNeeded = newStatus === 'received' ? 'imports.receive' : 'imports.update'
  try { await requirePermission(permNeeded) }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  const { data: imp } = await supabase
    .from('imports')
    .select('status')
    .eq('id', importId)
    .single()

  if (!imp) return { error: 'Importación no encontrada.' }

  const allowed = ALLOWED_TRANSITIONS[imp.status] ?? []
  if (!allowed.includes(newStatus))
    return { error: `No se puede pasar de "${imp.status}" a "${newStatus}".` }

  const patch = newStatus === 'received'
    ? { status: newStatus, actual_arrival: new Date().toISOString().split('T')[0] }
    : { status: newStatus }

  const { error } = await supabase.from('imports').update(patch).eq('id', importId)
  if (error) return { error: error.message }

  revalidatePath('/admin/imports')
  revalidatePath(`/admin/imports/${importId}`)
  return {}
}

// ─── addImportOrderAction ─────────────────────────────────────────────────────

export async function addImportOrderAction(
  importId: string,
  _prev: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  try { await requirePermission('imports.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const purchaseOrderId = (formData.get('purchase_order_id') as string)?.trim()
  if (!purchaseOrderId) return { errors: { purchase_order_id: ['Selecciona una orden de compra.'] } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('import_purchase_orders')
    .insert({ import_id: importId, purchase_order_id: purchaseOrderId })

  if (error) {
    if (error.code === '23505') return { errors: { _: ['Esa orden ya está vinculada a una importación.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath(`/admin/imports/${importId}`)
  return { success: true, message: 'Orden vinculada.' }
}

// ─── removeImportOrderAction ──────────────────────────────────────────────────

export async function removeImportOrderAction(
  linkId: string,
  importId: string
): Promise<{ error?: string }> {
  try { await requirePermission('imports.update') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { error } = await supabase.from('import_purchase_orders').delete().eq('id', linkId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/imports/${importId}`)
  return {}
}

// ─── addImportExpenseAction ───────────────────────────────────────────────────

export async function addImportExpenseAction(
  importId: string,
  _prev: ImportActionState,
  formData: FormData
): Promise<ImportActionState> {
  try { await requirePermission('imports.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const concept  = (formData.get('concept')  as string)
  const amount   = parseFloat(formData.get('amount') as string)
  const currency = (formData.get('currency') as string) || 'USD'
  const notes    = (formData.get('notes')    as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  const validConcepts = ['freight','insurance','customs','taxes','storage','transport','other']
  if (!validConcepts.includes(concept))        errors.concept = ['Concepto no válido.']
  if (!Number.isFinite(amount) || amount <= 0) errors.amount  = ['El monto debe ser mayor a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('import_expenses')
    .insert({ import_id: importId, concept, amount, currency, notes })

  if (error) return { errors: { _: [error.message] } }

  revalidatePath(`/admin/imports/${importId}`)
  return { success: true, message: 'Gasto registrado.' }
}

// ─── removeImportExpenseAction ────────────────────────────────────────────────

export async function removeImportExpenseAction(
  expenseId: string,
  importId: string
): Promise<{ error?: string }> {
  try { await requirePermission('imports.update') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { error } = await supabase.from('import_expenses').delete().eq('id', expenseId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/imports/${importId}`)
  return {}
}
