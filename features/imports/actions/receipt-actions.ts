'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type ReceiptActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

function revalidateImport(importId: string, receiptId?: string) {
  revalidatePath(`/admin/imports/${importId}`)
  revalidatePath(`/admin/imports/${importId}/receipts`)
  if (receiptId) revalidatePath(`/admin/imports/${importId}/receipts/${receiptId}`)
  revalidatePath('/admin/imports')
  revalidatePath('/admin/inventory')
}

// ─── createImportReceiptAction ────────────────────────────────────────────────
// Crea la recepción en borrador con todos los productos pendientes.
// Recibe reference, location_id, notes, y por cada producto:
//   received_quantity_[productId] y damaged_quantity_[productId]

export async function createImportReceiptAction(
  importId: string,
  _prev: ReceiptActionState,
  formData: FormData
): Promise<ReceiptActionState> {
  try { await requirePermission('imports.receipts.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference  = (formData.get('reference')  as string)?.trim()
  const locationId = (formData.get('location_id') as string)?.trim()
  const notes      = (formData.get('notes')       as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference)  errors.reference   = ['La referencia es obligatoria.']
  if (!locationId) errors.location_id = ['Selecciona una ubicación de destino.']

  // Parse product quantities from form
  const productIds: string[] = []
  for (const [key] of formData.entries()) {
    if (key.startsWith('received_')) {
      productIds.push(key.replace('received_', ''))
    }
  }

  const items: {
    product_id:                   string
    expected_quantity:            number
    previously_received_quantity: number
    received_quantity:            number
    damaged_quantity:             number
    item_notes:                   string | null
  }[] = []

  for (const pid of productIds) {
    const received  = parseInt((formData.get(`received_${pid}`)        as string) || '0')
    const damaged   = parseInt((formData.get(`damaged_${pid}`)         as string) || '0')
    const expected  = parseInt((formData.get(`expected_${pid}`)        as string) || '0')
    const prev      = parseInt((formData.get(`prev_received_${pid}`)   as string) || '0')
    const itemNotes = (formData.get(`notes_${pid}`) as string)?.trim() || null

    if (!Number.isFinite(received) || received < 0) {
      errors[`received_${pid}`] = ['Cantidad recibida no válida.']
      continue
    }
    if (!Number.isFinite(damaged) || damaged < 0) {
      errors[`damaged_${pid}`] = ['Cantidad dañada no válida.']
      continue
    }
    if (damaged > received) {
      errors[`damaged_${pid}`] = ['Las unidades dañadas no pueden superar las recibidas.']
      continue
    }
    items.push({
      product_id:                   pid,
      expected_quantity:            expected,
      previously_received_quantity: prev,
      received_quantity:            received,
      damaged_quantity:             damaged,
      item_notes:                   itemNotes,
    })
  }

  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create receipt header
  const { data: receipt, error: receiptError } = await supabase
    .from('import_receipts')
    .insert({
      import_id:   importId,
      reference,
      location_id: locationId,
      notes,
      created_by:  user?.id,
    })
    .select('id')
    .single()

  if (receiptError) {
    if (receiptError.code === '23505') return { errors: { reference: ['Ya existe una recepción con esa referencia.'] } }
    return { errors: { _: [receiptError.message] } }
  }

  // Create items (all products, even with received = 0 for completeness)
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('import_receipt_items')
      .insert(
        items.map((i) => ({
          receipt_id:                   receipt.id,
          product_id:                   i.product_id,
          expected_quantity:            i.expected_quantity,
          previously_received_quantity: i.previously_received_quantity,
          received_quantity:            i.received_quantity,
          damaged_quantity:             i.damaged_quantity,
          notes:                        i.item_notes,
        }))
      )

    if (itemsError) {
      // Cleanup: delete the orphan receipt header
      await supabase.from('import_receipts').delete().eq('id', receipt.id)
      return { errors: { _: [itemsError.message] } }
    }
  }

  revalidateImport(importId, receipt.id)
  redirect(`/admin/imports/${importId}/receipts/${receipt.id}`)
}

// ─── updateReceiptItemsAction ─────────────────────────────────────────────────
// Actualiza las cantidades de todos los ítems de una recepción en borrador.

export async function updateReceiptItemsAction(
  receiptId: string,
  importId:  string,
  _prev: ReceiptActionState,
  formData: FormData
): Promise<ReceiptActionState> {
  try { await requirePermission('imports.receipts.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const supabase = await createClient()

  // Verify draft status
  const { data: receipt } = await supabase
    .from('import_receipts')
    .select('status')
    .eq('id', receiptId)
    .single()

  if (!receipt)                   return { errors: { _: ['Recepción no encontrada.'] } }
  if (receipt.status !== 'draft') return { errors: { _: ['Solo se pueden editar recepciones en borrador.'] } }

  const errors: Record<string, string[]> = {}

  // Collect item updates
  const updates: { id: string; received: number; damaged: number; notes: string | null }[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('received_item_')) {
      const itemId  = key.replace('received_item_', '')
      const received = parseInt(value as string)
      const damaged  = parseInt((formData.get(`damaged_item_${itemId}`) as string) || '0')
      const notes    = (formData.get(`notes_item_${itemId}`) as string)?.trim() || null

      if (!Number.isFinite(received) || received < 0) { errors[key] = ['Cantidad no válida.']; continue }
      if (!Number.isFinite(damaged)  || damaged  < 0) { errors[`damaged_item_${itemId}`] = ['Cantidad no válida.']; continue }
      if (damaged > received) { errors[`damaged_item_${itemId}`] = ['Las dañadas no pueden superar las recibidas.']; continue }
      updates.push({ id: itemId, received, damaged, notes })
    }
  }

  if (Object.keys(errors).length) return { errors }

  // Apply updates
  for (const u of updates) {
    const { error } = await supabase
      .from('import_receipt_items')
      .update({
        received_quantity: u.received,
        damaged_quantity:  u.damaged,
        notes:             u.notes,
      })
      .eq('id', u.id)
      .eq('receipt_id', receiptId)

    if (error) return { errors: { _: [error.message] } }
  }

  revalidateImport(importId, receiptId)
  return { success: true, message: 'Cantidades actualizadas.' }
}

// ─── confirmImportReceiptAction ───────────────────────────────────────────────
// Llama a la función transaccional de base de datos.

export async function confirmImportReceiptAction(
  receiptId: string,
  importId:  string
): Promise<{ error?: string }> {
  try { await requirePermission('imports.receipts.confirm') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('confirm_import_receipt', {
    p_receipt_id:   receiptId,
    p_confirmed_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidateImport(importId, receiptId)
  return {}
}

// ─── cancelImportReceiptAction ────────────────────────────────────────────────

export async function cancelImportReceiptAction(
  receiptId: string,
  importId:  string
): Promise<{ error?: string }> {
  try { await requirePermission('imports.receipts.cancel') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('cancel_import_receipt', {
    p_receipt_id:   receiptId,
    p_cancelled_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidateImport(importId, receiptId)
  return {}
}
