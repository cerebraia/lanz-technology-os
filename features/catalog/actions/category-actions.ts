'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCategoryBySlug } from '@/features/catalog/data/categories'
import { slugify } from '@/lib/utils/slugify'

export type CategoryActionState =
  | { errors: Record<string, string[]>; message?: string }
  | { success: true; message: string }
  | undefined

async function requireCatalogPermission(permission: string) {
  await verifySession()
  const ok = await checkPermission(permission)
  if (!ok) throw new Error('Sin permiso para realizar esta acción.')
}

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    await requireCatalogPermission('catalog.categories.create')
  } catch {
    return { errors: { _: ['Sin permiso para crear categorías.'] } }
  }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const rawSlug = (formData.get('slug') as string)?.trim()
  const slug = rawSlug ? slugify(rawSlug) : slugify(name ?? '')

  const errors: Record<string, string[]> = {}

  if (!name) errors.name = ['El nombre es obligatorio.']
  if (!slug) errors.slug = ['El slug es obligatorio.']

  if (Object.keys(errors).length) return { errors }

  const existing = await getCategoryBySlug(slug)
  if (existing) {
    return { errors: { slug: ['Este slug ya está en uso. Elige otro.'] } }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    description,
    sort_order: sortOrder,
    is_active: isActive,
  })

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/catalog/categories')
  redirect('/admin/catalog/categories')
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    await requireCatalogPermission('catalog.categories.update')
  } catch {
    return { errors: { _: ['Sin permiso para editar categorías.'] } }
  }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isActive = formData.get('is_active') === 'true'
  const rawSlug = (formData.get('slug') as string)?.trim()
  const slug = rawSlug ? slugify(rawSlug) : slugify(name ?? '')

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ['El nombre es obligatorio.']
  if (!slug) errors.slug = ['El slug es obligatorio.']
  if (Object.keys(errors).length) return { errors }

  const existing = await getCategoryBySlug(slug, id)
  if (existing) {
    return { errors: { slug: ['Este slug ya está en uso. Elige otro.'] } }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({ name, slug, description, sort_order: sortOrder, is_active: isActive })
    .eq('id', id)

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/catalog/categories')
  revalidatePath(`/admin/catalog/categories/${id}`)
  return { success: true, message: 'Categoría actualizada.' }
}

export async function toggleCategoryActiveAction(id: string, isActive: boolean) {
  try {
    await requireCatalogPermission('catalog.categories.update')
  } catch {
    return
  }

  const supabase = await createClient()
  await supabase.from('categories').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin/catalog/categories')
}
