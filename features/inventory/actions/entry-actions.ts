'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type EntryActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── createEntryAction ────────────────────────────────────────────────────────
// Crea la cabecera de la entrada en estado draft y redirige al detalle.

export async function createEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  try { await requirePermission('inventory.entries.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference     = (formData.get('reference')     as string)?.trim()
  const supplierName  = (formData.get('supplier_name') as string)?.trim() || null
  const entryType     = (formData.get('entry_type')    as string)
  const notes         = (formData.get('notes')         as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference)                                                         errors.reference   = ['La referencia es obligatoria.']
  if (!['purchase', 'import', 'return', 'adjustment'].includes(entryType)) errors.entry_type = ['Tipo de entrada no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('inventory_entries')
    .insert({ reference, supplier_name: supplierName, entry_type: entryType, notes, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/inventory/entries')
  redirect(`/admin/inventory/entries/${data.id}`)
}

// ─── addEntryItemAction ───────────────────────────────────────────────────────
// Agrega un producto a una entrada en borrador.

export async function addEntryItemAction(
  entryId: string,
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  try { await requirePermission('inventory.entries.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId = (formData.get('product_id') as string)?.trim()
  const quantity  = parseInt(formData.get('quantity') as string)
  const notes     = (formData.get('notes') as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!productId)                    errors.product_id = ['El producto es obligatorio.']
  if (!Number.isFinite(quantity) || quantity <= 0)
                                     errors.quantity   = ['La cantidad debe ser un entero mayor a cero.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()

  // Verificar que la entrada existe y está en draft
  const { data: entry } = await supabase
    .from('inventory_entries')
    .select('status')
    .eq('id', entryId)
    .single()

  if (!entry)              return { errors: { _: ['Entrada no encontrada.'] } }
  if (entry.status !== 'draft') return { errors: { _: ['Solo se pueden agregar productos a entradas en borrador.'] } }

  const { error } = await supabase
    .from('inventory_entry_items')
    .insert({ inventory_entry_id: entryId, product_id: productId, quantity, notes })

  if (error) return { errors: { _: [error.message] } }

  revalidatePath(`/admin/inventory/entries/${entryId}`)
  return { success: true, message: 'Producto agregado.' }
}

// ─── removeEntryItemAction ────────────────────────────────────────────────────
// Elimina un producto de una entrada en borrador.

export async function removeEntryItemAction(
  itemId: string,
  entryId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.entries.create') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  // Verificar que la entrada está en draft
  const { data: item } = await supabase
    .from('inventory_entry_items')
    .select('inventory_entries!inner(status)')
    .eq('id', itemId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryStatus = (item as any)?.inventory_entries?.status
  if (entryStatus && entryStatus !== 'draft')
    return { error: 'No se pueden eliminar ítems de una entrada ya confirmada o cancelada.' }

  const { error } = await supabase
    .from('inventory_entry_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/inventory/entries/${entryId}`)
  return {}
}

// ─── confirmEntryAction ───────────────────────────────────────────────────────
// Confirma la entrada. Llama a confirm_inventory_entry() en DB.
// La función DB genera los movimientos de forma atómica.

export async function confirmEntryAction(
  entryId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.entries.confirm') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('confirm_inventory_entry', {
    p_entry_id:     entryId,
    p_confirmed_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/entries')
  revalidatePath(`/admin/inventory/entries/${entryId}`)
  revalidatePath('/admin/inventory/movements')
  return {}
}

// ─── cancelEntryAction ────────────────────────────────────────────────────────
// Cancela una entrada en borrador. No genera movimientos.

export async function cancelEntryAction(
  entryId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.entries.cancel') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('cancel_inventory_entry', {
    p_entry_id:     entryId,
    p_cancelled_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/inventory/entries')
  revalidatePath(`/admin/inventory/entries/${entryId}`)
  return {}
}
