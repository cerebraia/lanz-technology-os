'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'
import { getProductBySlug, getProductBySku } from '@/features/catalog/data/products'
import { slugify } from '@/lib/utils/slugify'

export type ProductActionState =
  | { errors: Record<string, string[]>; message?: string }
  | { success: true; message: string }
  | undefined

async function requireProductPermission(permission: string) {
  await verifySession()
  const ok = await checkPermission(permission)
  if (!ok) throw new Error('Sin permiso.')
}

function parseProductForm(formData: FormData) {
  const name               = (formData.get('name') as string)?.trim()
  const rawSlug            = (formData.get('slug') as string)?.trim()
  const sku                = (formData.get('sku') as string)?.trim().toUpperCase()
  const shortDescription   = (formData.get('short_description') as string)?.trim() || null
  const description        = (formData.get('description') as string)?.trim() || null
  const categoryId         = (formData.get('category_id') as string) || null
  const brand              = (formData.get('brand') as string)?.trim() || null
  const model              = (formData.get('model') as string)?.trim() || null
  const salePriceRaw       = formData.get('sale_price') as string
  const salePrice          = salePriceRaw ? parseFloat(salePriceRaw) : 0
  const promoPriceRaw      = (formData.get('promotional_price') as string)?.trim()
  const promotionalPrice   = promoPriceRaw && promoPriceRaw !== '' ? parseFloat(promoPriceRaw) : null
  const cashPriceRaw       = (formData.get('cash_price_usd') as string)?.trim()
  const cashPriceUSD       = cashPriceRaw && cashPriceRaw !== '' ? parseFloat(cashPriceRaw) : null
  const bcvPriceRaw        = (formData.get('bcv_reference_price_usd') as string)?.trim()
  const bcvReferencePriceUSD = bcvPriceRaw && bcvPriceRaw !== '' ? parseFloat(bcvPriceRaw) : null
  const currencyCode       = (formData.get('currency_code') as string) || 'USD'
  const status             = (formData.get('status') as string) || 'draft'
  const minStock           = parseInt(formData.get('min_stock') as string) || 0
  const isFeatured         = formData.get('is_featured') === 'on'
  const youtubeUrl         = (formData.get('youtube_url') as string)?.trim() || null
  const slug               = rawSlug ? slugify(rawSlug) : slugify(name ?? '')

  // Validación simple de URL de YouTube
  let validatedYoutubeUrl: string | null = null
  if (youtubeUrl) {
    const isYouTube = youtubeUrl.includes('youtube.com/') || youtubeUrl.includes('youtu.be/')
    if (isYouTube) validatedYoutubeUrl = youtubeUrl
  }

  return {
    name, slug, sku, short_description: shortDescription,
    description, category_id: categoryId || null,
    brand, model, sale_price: salePrice,
    promotional_price:        promotionalPrice,
    cash_price_usd:           cashPriceUSD,
    bcv_reference_price_usd:  bcvReferencePriceUSD,
    currency_code: currencyCode, status, min_stock: minStock,
    is_featured: isFeatured,
    youtube_url: validatedYoutubeUrl,
  }
}

function validateProductFields(
  fields: ReturnType<typeof parseProductForm>,
  excludeId?: string
): Record<string, string[]> {
  void excludeId
  const errors: Record<string, string[]> = {}

  if (!fields.name)           errors.name     = ['El nombre es obligatorio.']
  if (fields.name && fields.name.length < 3)
                              errors.name     = ['El nombre debe tener al menos 3 caracteres.']
  if (!fields.sku)            errors.sku      = ['El SKU es obligatorio.']
  if (!fields.slug)           errors.slug     = ['El slug es obligatorio.']
  if (fields.sale_price < 0)  errors.sale_price = ['El precio no puede ser negativo.']
  if (fields.promotional_price !== null) {
    if (fields.promotional_price <= 0)
      errors.promotional_price = ['El precio promocional debe ser mayor a cero.']
    else if (fields.sale_price > 0 && fields.promotional_price >= fields.sale_price)
      errors.promotional_price = ['El precio promocional debe ser menor al precio normal.']
  }
  if (!['draft', 'active', 'archived'].includes(fields.status))
    errors.status = ['Estado no válido.']

  return errors
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try { await requireProductPermission('catalog.products.create') }
  catch { return { errors: { _: ['Sin permiso para crear productos.'] } } }

  const fields = parseProductForm(formData)
  const errors = validateProductFields(fields)
  if (Object.keys(errors).length) return { errors }

  if (await getProductBySlug(fields.slug))
    return { errors: { slug: ['Este slug ya está en uso.'] } }
  if (await getProductBySku(fields.sku))
    return { errors: { sku: ['Este SKU ya está en uso.'] } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...fields, created_by: user?.id })
    .select('id')
    .single()

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/catalog/products')
  redirect(`/admin/catalog/products/${product.id}`)
}

export async function updateProductAction(
  id: string,
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try { await requireProductPermission('catalog.products.update') }
  catch { return { errors: { _: ['Sin permiso para editar productos.'] } } }

  const fields = parseProductForm(formData)
  const errors = validateProductFields(fields, id)
  if (Object.keys(errors).length) return { errors }

  if (await getProductBySlug(fields.slug, id))
    return { errors: { slug: ['Este slug ya está en uso.'] } }
  if (await getProductBySku(fields.sku, id))
    return { errors: { sku: ['Este SKU ya está en uso.'] } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)

  if (error) return { errors: { _: [error.message] } }

  revalidatePath('/admin/catalog/products')
  revalidatePath(`/admin/catalog/products/${id}`)
  revalidatePath('/')
  revalidatePath('/catalog')
  return { success: true, message: 'Producto actualizado.' }
}

// ─── Publish (con validación de requisitos) ────────────────────────────────

export async function publishProductAction(
  id: string
): Promise<{ error?: string }> {
  await verifySession()
  if (!(await checkPermission('catalog.products.publish')))
    return { error: 'Sin permiso para publicar productos.' }

  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, sku, category_id, sale_price, published_at, status')
    .eq('id', id)
    .single()

  if (!product) return { error: 'Producto no encontrado.' }

  // Verificar requisitos de publicación
  const missing: string[] = []
  if (!product.name)        missing.push('nombre')
  if (!product.sku)         missing.push('SKU')
  if (!product.category_id) missing.push('categoría')
  if (!product.sale_price || product.sale_price <= 0) missing.push('precio de venta mayor a cero')

  // Verificar que tenga al menos una imagen
  const { count: imageCount } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id)

  if ((imageCount ?? 0) === 0) missing.push('al menos una imagen')

  if (missing.length > 0)
    return { error: `Para publicar, el producto necesita: ${missing.join(', ')}.` }

  const now = new Date().toISOString()
  await supabase
    .from('products')
    .update({
      status:       'active',
      is_published: true,
      // published_at solo se escribe la primera vez
      ...(product.published_at ? {} : { published_at: now }),
    })
    .eq('id', id)

  revalidatePath('/admin/catalog/products')
  revalidatePath(`/admin/catalog/products/${id}`)
  revalidatePath('/')
  revalidatePath('/catalog')
  return {}
}

// ─── Hide (ocultar temporalmente de la tienda) ─────────────────────────────

export async function hideProductAction(
  id: string
): Promise<{ error?: string }> {
  await verifySession()
  if (!(await checkPermission('catalog.products.publish')))
    return { error: 'Sin permiso para cambiar visibilidad.' }

  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ is_published: false })
    .eq('id', id)

  revalidatePath('/admin/catalog/products')
  revalidatePath(`/admin/catalog/products/${id}`)
  revalidatePath('/')
  revalidatePath('/catalog')
  return {}
}

// ─── Set Draft ────────────────────────────────────────────────────────────

export async function setDraftAction(
  id: string
): Promise<{ error?: string }> {
  await verifySession()
  if (!(await checkPermission('catalog.products.update')))
    return { error: 'Sin permiso para cambiar estado.' }

  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ status: 'draft', is_published: false })
    .eq('id', id)

  revalidatePath('/admin/catalog/products')
  revalidatePath(`/admin/catalog/products/${id}`)
  revalidatePath('/')
  revalidatePath('/catalog')
  return {}
}

// ─── Archive ───────────────────────────────────────────────────────────────

export async function archiveProductAction(
  id: string
): Promise<{ error?: string }> {
  await verifySession()
  if (!(await checkPermission('catalog.products.delete')))
    return { error: 'Sin permiso para archivar productos.' }

  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ status: 'archived', is_published: false, archived_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/catalog/products')
  revalidatePath(`/admin/catalog/products/${id}`)
  revalidatePath('/')
  revalidatePath('/catalog')
  return {}
}

// ─── Unpublish (alias semántico de hide, mantenido por compatibilidad) ─────

export async function unpublishProductAction(id: string): Promise<void> {
  await hideProductAction(id)
}
