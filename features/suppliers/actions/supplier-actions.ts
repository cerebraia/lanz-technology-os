'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type SupplierActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function requirePermission(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

function parseSupplierForm(formData: FormData) {
  return {
    name:    (formData.get('name')    as string)?.trim(),
    company: (formData.get('company') as string)?.trim() || null,
    email:   (formData.get('email')   as string)?.trim() || null,
    phone:   (formData.get('phone')   as string)?.trim() || null,
    country: (formData.get('country') as string)?.trim(),
    city:    (formData.get('city')    as string)?.trim() || null,
    address: (formData.get('address') as string)?.trim() || null,
    website: (formData.get('website') as string)?.trim() || null,
    tax_id:  (formData.get('tax_id')  as string)?.trim() || null,
    notes:   (formData.get('notes')   as string)?.trim() || null,
  }
}

function validateSupplier(fields: ReturnType<typeof parseSupplierForm>) {
  const errors: Record<string, string[]> = {}

  if (!fields.name)    errors.name    = ['El nombre del proveedor es obligatorio.']
  if (!fields.country) errors.country = ['El país es obligatorio.']

  if (fields.email) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(fields.email)) errors.email = ['El email no tiene un formato válido.']
  }

  return errors
}

// ─── createSupplierAction ─────────────────────────────────────────────────────

export async function createSupplierAction(
  _prev: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  try { await requirePermission('suppliers.create') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const fields = parseSupplierForm(formData)
  const errors = validateSupplier(fields)
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert(fields)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { errors: { name: ['Ya existe un proveedor con ese nombre.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/suppliers')
  redirect(`/admin/suppliers/${data.id}`)
}

// ─── updateSupplierAction ─────────────────────────────────────────────────────

export async function updateSupplierAction(
  supplierId: string,
  _prev: SupplierActionState,
  formData: FormData
): Promise<SupplierActionState> {
  try { await requirePermission('suppliers.update') }
  catch (e) { return { errors: { _: [(e as Error).message] } } }

  const fields = parseSupplierForm(formData)
  const errors = validateSupplier(fields)
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update(fields)
    .eq('id', supplierId)

  if (error) {
    if (error.code === '23505') return { errors: { name: ['Ya existe un proveedor con ese nombre.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/suppliers')
  revalidatePath(`/admin/suppliers/${supplierId}`)
  redirect(`/admin/suppliers/${supplierId}`)
}

// ─── toggleSupplierStatusAction ───────────────────────────────────────────────

export async function toggleSupplierStatusAction(
  supplierId: string,
  newStatus: boolean
): Promise<{ error?: string }> {
  try { await requirePermission('suppliers.disable') }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: newStatus })
    .eq('id', supplierId)

  if (error) return { error: error.message }

  revalidatePath('/admin/suppliers')
  revalidatePath(`/admin/suppliers/${supplierId}`)
  return {}
}
