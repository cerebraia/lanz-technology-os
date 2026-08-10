'use server'

import { revalidatePath } from 'next/cache'
import { redirect }        from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { computeProfitability } from '@/features/imports/data/profitability'

export type CostActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── createAllocationAction ───────────────────────────────────────────────────
// Recibe el método y los items precalculados desde el componente cliente.

export async function createAllocationAction(
  importId: string,
  _prev: CostActionState,
  formData: FormData
): Promise<CostActionState> {
  try { await requirePermission('imports.costs.allocate') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const method  = (formData.get('allocation_method') as string)
  const notes   = (formData.get('notes') as string)?.trim() || null
  const totalAmount = parseFloat(formData.get('total_amount') as string)

  const validMethods = ['quantity', 'value', 'manual']
  const errors: Record<string, string[]> = {}
  if (!validMethods.includes(method))                       errors.allocation_method = ['Método no válido.']
  if (!Number.isFinite(totalAmount) || totalAmount < 0)     errors.total_amount       = ['Monto total no válido.']
  if (Object.keys(errors).length) return { errors }

  // Parse per-product items
  const items: {
    product_id:            string
    quantity:              number
    unit_merchandise_cost: number
    allocated_amount:      number
    final_unit_cost:       number
  }[] = []

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('alloc_')) {
      const productId      = key.replace('alloc_', '')
      const allocated      = parseFloat(value as string)
      const qty            = parseInt((formData.get(`qty_${productId}`) as string) || '0')
      const unitMerch      = parseFloat((formData.get(`unit_merch_${productId}`) as string) || '0')

      if (!Number.isFinite(allocated) || allocated < 0) { errors[key] = ['Monto no válido.']; continue }
      if (!Number.isFinite(qty)       || qty <= 0)      continue

      const final_unit = unitMerch + (qty > 0 ? allocated / qty : 0)
      items.push({ product_id: productId, quantity: qty, unit_merchandise_cost: unitMerch, allocated_amount: allocated, final_unit_cost: final_unit })
    }
  }

  if (Object.keys(errors).length) return { errors }
  if (items.length === 0) return { errors: { _: ['No hay productos con cantidades válidas.'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create allocation header
  const { data: allocation, error: allocError } = await supabase
    .from('import_cost_allocations')
    .insert({
      import_id:         importId,
      allocation_method: method,
      total_amount:      totalAmount,
      currency:          'USD',
      notes,
      created_by:        user?.id,
    })
    .select('id')
    .single()

  if (allocError) return { errors: { _: [allocError.message] } }

  // Insert items
  const { error: itemsError } = await supabase
    .from('import_cost_allocation_items')
    .insert(items.map((i) => ({ ...i, allocation_id: allocation.id })))

  if (itemsError) {
    await supabase.from('import_cost_allocations').delete().eq('id', allocation.id)
    return { errors: { _: [itemsError.message] } }
  }

  revalidatePath(`/admin/imports/${importId}/costs`)
  revalidatePath(`/admin/imports/${importId}/profitability`)
  redirect(`/admin/imports/${importId}/costs`)
}

// ─── deleteAllocationAction ───────────────────────────────────────────────────

export async function deleteAllocationAction(
  allocationId: string,
  importId: string
): Promise<{ error?: string }> {
  try { await requirePermission('imports.costs.allocate') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('import_cost_allocations')
    .delete()
    .eq('id', allocationId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/imports/${importId}/costs`)
  revalidatePath(`/admin/imports/${importId}/profitability`)
  return {}
}

// ─── saveProfitabilitySnapshotAction ─────────────────────────────────────────

export async function saveProfitabilitySnapshotAction(
  importId: string
): Promise<{ error?: string; id?: string }> {
  try { await requirePermission('imports.profitability.read') }
  catch (e) { return { error: (e as Error).message } }

  const analysis = await computeProfitability(importId)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('import_profitability')
    .insert({
      import_id:              importId,
      total_merchandise_cost: analysis.total_merchandise_cost,
      total_logistics_cost:   analysis.total_logistics_cost,
      total_cost:             analysis.total_cost,
      total_revenue:          analysis.total_revenue,
      gross_profit:           analysis.gross_profit,
      margin:                 analysis.margin,
      roi:                    analysis.roi,
      currency:               'USD',
      created_by:             user?.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/imports/${importId}/profitability`)
  return { id: data.id }
}
