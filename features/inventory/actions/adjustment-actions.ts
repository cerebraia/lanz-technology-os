'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCurrentStockForProduct } from '@/features/inventory/data/adjustments'

export type AdjustmentActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── createAdjustmentAction ───────────────────────────────────────────────────

export async function createAdjustmentAction(
  _prev: AdjustmentActionState,
  formData: FormData
): Promise<AdjustmentActionState> {
  try { await requirePermission('inventory.adjustments.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const reference = (formData.get('reference') as string)?.trim()
  const reason    = (formData.get('reason')    as string)?.trim()
  const notes     = (formData.get('notes')     as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!reference) errors.reference = ['La referencia es obligatoria.']
  if (!reason)    errors.reason    = ['El motivo es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('inventory_adjustments')
    .insert({ reference, reason, notes, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/inventory/adjustments')
  redirect(`/admin/inventory/adjustments/${data.id}`)
}

// ─── addAdjustmentItemAction ──────────────────────────────────────────────────
// Agrega un ítem al ajuste. Captura el current_stock en el momento de la acción.

export async function addAdjustmentItemAction(
  adjustmentId: string,
  _prev: AdjustmentActionState,
  formData: FormData
): Promise<AdjustmentActionState> {
  try { await requirePermission('inventory.adjustments.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const productId     = (formData.get('product_id')    as string)?.trim()
  const physicalStock = parseInt(formData.get('physical_stock') as string)
  const notes         = (formData.get('notes') as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!productId)                                         errors.product_id     = ['El producto es obligatorio.']
  if (!Number.isFinite(physicalStock) || physicalStock < 0)
                                                          errors.physical_stock = ['El conteo físico debe ser cero o mayor.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()

  // Verificar que el ajuste está en draft
  const { data: adj } = await supabase
    .from('inventory_adjustments')
    .select('status')
    .eq('id', adjustmentId)
    .single()

  if (!adj)              return { errors: { _: ['Ajuste no encontrado.'] } }
  if (adj.status !== 'draft')
    return { errors: { _: ['Solo se pueden agregar productos a ajustes en borrador.'] } }

  // Verificar producto no duplicado en este ajuste
  const { count } = await supabase
    .from('inventory_adjustment_items')
    .select('*', { count: 'exact', head: true })
    .eq('inventory_adjustment_id', adjustmentId)
    .eq('product_id', productId)

  if ((count ?? 0) > 0)
    return { errors: { product_id: ['Este producto ya está en el ajuste.'] } }

  // Obtener stock actual (snapshot)
  const currentStock = await getCurrentStockForProduct(productId)
  const difference   = physicalStock - currentStock

  const { error } = await supabase
    .from('inventory_adjustment_items')
    .insert({
      inventory_adjustment_id: adjustmentId,
      product_id:              productId,
      current_stock:           currentStock,
      physical_stock:          physicalStock,
      difference,
      notes,
    })

  if (error) return { errors: { _: [error.message] } }

  revalidatePath(`/admin/inventory/adjustments/${adjustmentId}`)
  return { success: true, message: `Producto agregado. Diferencia: ${difference >= 0 ? '+' : ''}${difference}` }
}

// ─── removeAdjustmentItemAction ───────────────────────────────────────────────

export async function removeAdjustmentItemAction(
  itemId: string,
  adjustmentId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.adjustments.create') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_adjustment_items')
    .select('inventory_adjustments!inner(status)')
    .eq('id', itemId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (item as any)?.inventory_adjustments?.status
  if (status && status !== 'draft')
    return { error: 'No se pueden eliminar ítems de un ajuste ya confirmado o cancelado.' }

  const { error } = await supabase
    .from('inventory_adjustment_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/inventory/adjustments/${adjustmentId}`)
  return {}
}

// ─── confirmAdjustmentAction ──────────────────────────────────────────────────

export async function confirmAdjustmentAction(
  adjustmentId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.adjustments.confirm') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('confirm_inventory_adjustment', {
    p_adjustment_id: adjustmentId,
    p_confirmed_by:  user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/adjustments')
  revalidatePath(`/admin/inventory/adjustments/${adjustmentId}`)
  revalidatePath('/admin/inventory/movements')
  return {}
}

// ─── cancelAdjustmentAction ───────────────────────────────────────────────────

export async function cancelAdjustmentAction(
  adjustmentId: string
): Promise<{ error?: string }> {
  try { await requirePermission('inventory.adjustments.cancel') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('cancel_inventory_adjustment', {
    p_adjustment_id: adjustmentId,
    p_cancelled_by:  user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/inventory/adjustments')
  revalidatePath(`/admin/inventory/adjustments/${adjustmentId}`)
  return {}
}
