'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySession, checkPermission } from '@/lib/dal'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB
const MAX_IMAGES     = 10

export type ImageActionState =
  | { error: string }
  | { success: true; imageId: string; storagePath: string }
  | undefined

async function requireImagePermission() {
  await verifySession()
  const ok = await checkPermission('catalog.images.manage')
  if (!ok) throw new Error('Sin permiso para gestionar imágenes.')
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ImageActionState> {
  try { await requireImagePermission() }
  catch (e) { return { error: (e as Error).message } }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No se recibió ningún archivo.' }
  if (!ALLOWED_TYPES.includes(file.type))
    return { error: 'Formato no permitido. Usa JPEG, PNG o WebP.' }
  if (file.size > MAX_SIZE_BYTES)
    return { error: 'El archivo supera los 5 MB.' }

  const supabase = await createClient()

  // Verificar límite de imágenes
  const { count } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  if ((count ?? 0) >= MAX_IMAGES)
    return { error: `Máximo ${MAX_IMAGES} imágenes por producto.` }

  // Calcular sort_order como siguiente disponible
  const { data: existing } = await supabase
    .from('product_images')
    .select('sort_order, is_primary')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0
  const isPrimary     = !existing || existing.length === 0

  const ext      = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
  const filename = `products/${productId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('catalog-images')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: `Error al subir imagen: ${uploadError.message}` }

  const { data: imageRow, error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id:   productId,
      storage_path: filename,
      alt_text:     null,
      sort_order:   nextSortOrder,
      is_primary:   isPrimary,
    })
    .select('id')
    .single()

  if (dbError) {
    await supabase.storage.from('catalog-images').remove([filename])
    return { error: `Error al registrar imagen: ${dbError.message}` }
  }

  revalidatePath(`/admin/catalog/products/${productId}`)
  revalidatePath('/')
  return { success: true, imageId: imageRow.id, storagePath: filename }
}

export async function deleteProductImageAction(
  imageId: string,
  storagePath: string,
  productId: string
): Promise<{ error?: string }> {
  try { await requireImagePermission() }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  const { data: img } = await supabase
    .from('product_images')
    .select('is_primary, sort_order')
    .eq('id', imageId)
    .single()

  await supabase.storage.from('catalog-images').remove([storagePath])
  await supabase.from('product_images').delete().eq('id', imageId)

  // Si era la principal, promover la siguiente por sort_order
  if (img?.is_primary) {
    const { data: next } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .limit(1)

    if (next?.[0]) {
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', next[0].id)
    }
  }

  revalidatePath(`/admin/catalog/products/${productId}`)
  revalidatePath('/')
  return {}
}

export async function setPrimaryImageAction(
  imageId: string,
  productId: string
): Promise<{ error?: string }> {
  try { await requireImagePermission() }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  revalidatePath(`/admin/catalog/products/${productId}`)
  revalidatePath('/')
  return {}
}

export async function moveImageAction(
  imageId: string,
  productId: string,
  direction: 'up' | 'down'
): Promise<{ error?: string }> {
  try { await requireImagePermission() }
  catch (e) { return { error: (e as Error).message } }

  const supabase = await createClient()

  // Obtener todas las imágenes del producto ordenadas
  const { data: images } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (!images || images.length < 2) return {}

  const currentIndex = images.findIndex((img) => img.id === imageId)
  if (currentIndex === -1) return { error: 'Imagen no encontrada.' }

  const swapIndex =
    direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (swapIndex < 0 || swapIndex >= images.length) return {}

  const current = images[currentIndex]
  const swap    = images[swapIndex]

  // Intercambiar sort_order
  await supabase
    .from('product_images')
    .update({ sort_order: swap.sort_order })
    .eq('id', current.id)

  await supabase
    .from('product_images')
    .update({ sort_order: current.sort_order })
    .eq('id', swap.id)

  revalidatePath(`/admin/catalog/products/${productId}`)
  return {}
}
