'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

export type CrmActionState =
  | { errors: Record<string, string[]> }
  | { success: true; message: string }
  | undefined

async function req(perm: string) {
  await verifySession()
  const ok = await checkPermission(perm)
  if (!ok) throw new Error(`Sin permiso: ${perm}`)
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

export async function createCustomerAction(
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  try { await req('crm.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim() || null
  const company   = (formData.get('company')    as string)?.trim() || null
  const email     = (formData.get('email')      as string)?.trim() || null
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const whatsapp  = (formData.get('whatsapp')   as string)?.trim() || null
  const country   = (formData.get('country')    as string)?.trim() || null
  const city      = (formData.get('city')       as string)?.trim() || null
  const address   = (formData.get('address')    as string)?.trim() || null
  const notes     = (formData.get('notes')      as string)?.trim() || null
  const source    = (formData.get('source')     as string) || null

  const errors: Record<string, string[]> = {}
  if (!firstName) errors.first_name = ['El nombre es obligatorio.']
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Correo no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('customers')
    .insert({ first_name: firstName, last_name: lastName, company, email, phone, whatsapp, country, city, address, notes, source: source || null, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/crm/customers')
  redirect(`/admin/crm/customers/${data.id}`)
}

export async function updateCustomerAction(
  customerId: string,
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  try { await req('crm.update') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName  = (formData.get('last_name')  as string)?.trim() || null
  const company   = (formData.get('company')    as string)?.trim() || null
  const email     = (formData.get('email')      as string)?.trim() || null
  const phone     = (formData.get('phone')      as string)?.trim() || null
  const whatsapp  = (formData.get('whatsapp')   as string)?.trim() || null
  const country   = (formData.get('country')    as string)?.trim() || null
  const city      = (formData.get('city')       as string)?.trim() || null
  const address   = (formData.get('address')    as string)?.trim() || null
  const notes     = (formData.get('notes')      as string)?.trim() || null

  const errors: Record<string, string[]> = {}
  if (!firstName) errors.first_name = ['El nombre es obligatorio.']
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Correo no válido.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ first_name: firstName, last_name: lastName, company, email, phone, whatsapp, country, city, address, notes })
    .eq('id', customerId)

  if (error) return { errors: { _: [error.message] } }

  revalidatePath(`/admin/crm/customers/${customerId}`)
  revalidatePath('/admin/crm/customers')
  return { success: true, message: 'Cliente actualizado.' }
}

export async function archiveCustomerAction(customerId: string): Promise<{ error?: string }> {
  try { await req('crm.delete') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', customerId)
  if (error) return { error: error.message }
  revalidatePath('/admin/crm/customers')
  redirect('/admin/crm/customers')
}

// ─── TAGS ─────────────────────────────────────────────────────────────────────

export async function createTagAction(
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  try { await req('crm.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const name  = (formData.get('name')  as string)?.trim()
  const color = (formData.get('color') as string) || '#6366f1'

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const supabase = await createClient()
  const { error } = await supabase.from('customer_tags').insert({ name, color })
  if (error) {
    if (error.code === '23505') return { errors: { name: ['Ya existe una etiqueta con ese nombre.'] } }
    return { errors: { _: [error.message] } }
  }

  revalidatePath('/admin/crm/tags')
  return { success: true, message: 'Etiqueta creada.' }
}

export async function deleteTagAction(tagId: string): Promise<{ error?: string }> {
  try { await req('crm.delete') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('customer_tags').delete().eq('id', tagId)
  if (error) return { error: error.message }
  revalidatePath('/admin/crm/tags')
  return {}
}

export async function toggleTagAssignmentAction(
  customerId: string,
  tagId:      string,
  assign:     boolean
): Promise<{ error?: string }> {
  try { await req('crm.update') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()

  if (assign) {
    const { error } = await supabase
      .from('customer_tag_assignments')
      .insert({ customer_id: customerId, tag_id: tagId })
    if (error && error.code !== '23505') return { error: error.message }
  } else {
    const { error } = await supabase
      .from('customer_tag_assignments')
      .delete()
      .eq('customer_id', customerId)
      .eq('tag_id', tagId)
    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/crm/customers/${customerId}`)
  return {}
}

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────

export async function createActivityNoteAction(
  customerId: string,
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  try { await req('crm.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const description = (formData.get('description') as string)?.trim()
  if (!description) return { errors: { description: ['La descripción es obligatoria.'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('customer_activity')
    .insert({ customer_id: customerId, activity_type: 'note', description, created_by: user?.id })
  if (error) return { errors: { _: [error.message] } }

  revalidatePath(`/admin/crm/customers/${customerId}`)
  return { success: true, message: 'Nota registrada.' }
}

// ─── QUOTES ───────────────────────────────────────────────────────────────────

export async function createQuoteAction(
  _prev: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  try { await req('crm.quotes.create') } catch (e) { return { errors: { _: [(e as Error).message] } } }

  const customerId = (formData.get('customer_id') as string) || null
  const notes      = (formData.get('notes')       as string)?.trim() || null
  const expiresAt  = (formData.get('expires_at')  as string) || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('quotes')
    .insert({ customer_id: customerId, notes, expires_at: expiresAt, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  if (customerId) {
    await supabase.from('customer_activity').insert({
      customer_id:    customerId,
      activity_type:  'quote',
      reference_type: 'quote',
      reference_id:   data.id,
      description:    'Cotización creada',
      created_by:     user?.id,
    })
  }

  revalidatePath('/admin/crm/quotes')
  redirect('/admin/crm/quotes')
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
): Promise<{ error?: string }> {
  try { await req('crm.quotes.update') } catch (e) { return { error: (e as Error).message } }
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ status }).eq('id', quoteId)
  if (error) return { error: error.message }
  revalidatePath('/admin/crm/quotes')
  return {}
}
