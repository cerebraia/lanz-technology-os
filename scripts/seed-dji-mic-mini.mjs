/**
 * Seed script: DJI Mic Mini
 *
 * Uso:
 *   node scripts/seed-dji-mic-mini.mjs
 *
 * Requiere:
 *   SUPABASE_SERVICE_ROLE_KEY en .env.local
 *   La imagen fuente en scripts/dji-mic-mini-source.jpg
 *
 * Este script:
 *   1. Optimiza la imagen con sharp → WebP 800×800 px
 *   2. Sube al bucket catalog-images
 *   3. Crea/actualiza la categoría Audio
 *   4. Crea/actualiza el producto DJI Mic Mini
 *   5. Registra el stock inicial de 25 unidades
 */

import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ Faltan variables de entorno.')
  console.error('   Asegúrate de que .env.local contiene:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=...\n')
  console.error('   Cópiala desde: Supabase Studio → Project Settings → API → service_role\n')
  process.exit(1)
}

const SOURCE_IMAGE = join(__dirname, 'dji-mic-mini-source.jpg')
const STORAGE_PATH = 'products/dji-mic-mini/dji-mic-mini-principal.webp'
const BUCKET       = 'catalog-images'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── 1. Imagen ────────────────────────────────────────────────────────────────

async function processAndUploadImage() {
  if (!existsSync(SOURCE_IMAGE)) {
    console.error(`❌ Imagen no encontrada en: ${SOURCE_IMAGE}`)
    console.error('   Copia la imagen fuente a ese path antes de ejecutar.\n')
    process.exit(1)
  }

  console.log('📸 Procesando imagen con sharp...')

  // Importación dinámica de sharp (vive dentro de node_modules/next)
  const sharp = (await import(
    '../node_modules/sharp/lib/index.js'
  )).default

  const webpBuffer = await sharp(SOURCE_IMAGE)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer()

  console.log(`   Tamaño WebP: ${(webpBuffer.length / 1024).toFixed(1)} KB`)

  // Verificar si ya existe en storage
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list('products/dji-mic-mini')

  const alreadyUploaded = (existing ?? []).some(f => f.name === 'dji-mic-mini-principal.webp')

  if (alreadyUploaded) {
    console.log('   Imagen ya existe en storage — omitiendo subida.')
  } else {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(STORAGE_PATH, webpBuffer, {
        contentType: 'image/webp',
        upsert:      false,
      })

    if (uploadError) {
      // If it already exists, try upsert
      if (uploadError.message.includes('already exists') || uploadError.message.includes('duplicate')) {
        console.log('   Imagen existente — actualizando con upsert...')
        const { error: upsertError } = await supabase.storage
          .from(BUCKET)
          .upload(STORAGE_PATH, webpBuffer, { contentType: 'image/webp', upsert: true })
        if (upsertError) throw new Error(`Storage upload error: ${upsertError.message}`)
      } else {
        throw new Error(`Storage upload error: ${uploadError.message}`)
      }
    }
    console.log(`✅ Imagen subida: ${STORAGE_PATH}`)
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${STORAGE_PATH}`
  console.log(`   URL pública: ${publicUrl}`)
  return publicUrl
}

// ─── 2. Categoría ─────────────────────────────────────────────────────────────

async function upsertCategory() {
  console.log('\n📁 Categoría Audio...')

  const { data: existing } = await supabase
    .from('categories')
    .select('id, name, is_active')
    .ilike('name', 'audio')
    .maybeSingle()

  if (existing) {
    if (!existing.is_active) {
      await supabase.from('categories').update({ is_active: true }).eq('id', existing.id)
      console.log(`   Categoría reactivada: ${existing.name} (${existing.id})`)
    } else {
      console.log(`   Categoría existente: ${existing.name} (${existing.id})`)
    }
    return existing.id
  }

  const { data: created, error } = await supabase
    .from('categories')
    .insert({
      name:        'Audio',
      slug:        'audio',
      description: 'Micrófonos y accesorios de audio profesional',
      is_active:   true,
      sort_order:  40,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Category insert: ${error.message}`)
  console.log(`✅ Categoría creada: Audio (${created.id})`)
  return created.id
}

// ─── 3. Producto ──────────────────────────────────────────────────────────────

async function upsertProduct(categoryId) {
  console.log('\n📦 Producto DJI Mic Mini...')

  const description = [
    'El DJI Mic Mini es una solución de audio inalámbrica compacta que permite mejorar la calidad de las grabaciones sin configuraciones complicadas.',
    '',
    'Cuenta con reducción de ruido, conexión rápida, diseño ultraligero y compatibilidad con celulares y cámaras profesionales, según el receptor y los adaptadores utilizados.',
    '',
    'Es ideal para grabar videos, entrevistas, presentaciones, contenido para redes sociales, proyectos empresariales y producciones audiovisuales.',
    '',
    'Características:',
    '- Audio inalámbrico de alta calidad.',
    '- Reducción de ruido integrada.',
    '- Diseño compacto y ultraligero.',
    '- Conexión rápida y sencilla.',
    '- Compatible con celulares.',
    '- Compatible con cámaras profesionales mediante el receptor correspondiente.',
    '- Buena autonomía de batería.',
    '- Fácil de transportar.',
    '- Configuración rápida para comenzar a grabar.',
  ].join('\n')

  const productData = {
    sku:              'DJI-MIC-MINI',
    name:             'DJI Mic Mini',
    slug:             'dji-mic-mini',
    short_description: 'Micrófono inalámbrico compacto, ligero y fácil de utilizar, diseñado para obtener audio limpio y profesional desde celulares y cámaras compatibles.',
    description,
    sale_price:        199.00,   // precio anterior → tachado en tienda
    promotional_price: 160.00,   // precio actual  → resaltado en tienda
    currency_code:     'USD',
    brand:             'DJI',
    model:             'Mic Mini',
    is_featured:       true,
    is_published:      true,
    status:            'active',
    category_id:       categoryId,
    min_stock:         5,
    track_inventory:   true,
  }

  // Check if product already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id, name, is_published, is_featured, published_at')
    .or('slug.eq.dji-mic-mini,sku.eq.DJI-MIC-MINI')
    .maybeSingle()

  let productId

  if (existing) {
    console.log(`   Producto encontrado: ${existing.name} (${existing.id})`)
    const updateData = { ...productData }
    if (existing.published_at) delete updateData.published_at // preserve original date

    const { error } = await supabase
      .from('products')
      .update({
        ...updateData,
        published_at: existing.published_at ?? new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) throw new Error(`Product update: ${error.message}`)
    productId = existing.id
    console.log(`✅ Producto actualizado: ${existing.id}`)
  } else {
    const { data: created, error } = await supabase
      .from('products')
      .insert({ ...productData, published_at: new Date().toISOString() })
      .select('id')
      .single()

    if (error) throw new Error(`Product insert: ${error.message}`)
    productId = created.id
    console.log(`✅ Producto creado: ${created.id}`)
  }

  return productId
}

// ─── 4. Imagen en product_images ─────────────────────────────────────────────

async function linkImage(productId) {
  console.log('\n🖼  Vinculando imagen al producto...')

  const { data: existing } = await supabase
    .from('product_images')
    .select('id, storage_path, is_primary')
    .eq('product_id', productId)
    .eq('storage_path', STORAGE_PATH)
    .maybeSingle()

  if (existing) {
    if (!existing.is_primary) {
      // Set as primary
      await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
      await supabase.from('product_images').update({ is_primary: true }).eq('id', existing.id)
      console.log('   Imagen ya existente — marcada como principal.')
    } else {
      console.log('   Imagen ya registrada como principal.')
    }
    return
  }

  // Remove primary flag from other images
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('is_primary', true)

  const { error } = await supabase.from('product_images').insert({
    product_id:   productId,
    storage_path: STORAGE_PATH,
    alt_text:     'DJI Mic Mini, micrófono inalámbrico para celular y cámara',
    sort_order:   0,
    is_primary:   true,
  })

  if (error) throw new Error(`product_images insert: ${error.message}`)
  console.log('✅ Imagen registrada como principal')
}

// ─── 5. Inventario ────────────────────────────────────────────────────────────

async function setupInventory(productId) {
  console.log('\n📊 Inventario...')

  // Get default location
  const { data: loc } = await supabase
    .from('inventory_locations')
    .select('id, name, code')
    .eq('code', 'WH-001')
    .maybeSingle()

  let locationId = loc?.id

  if (!locationId) {
    const { data: anyLoc } = await supabase
      .from('inventory_locations')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    locationId = anyLoc?.id
  }

  if (!locationId) {
    const { data: created, error } = await supabase
      .from('inventory_locations')
      .insert({ name: 'Almacén principal', code: 'WH-001', description: 'Lanz Technology' })
      .select('id')
      .single()
    if (error) throw new Error(`Location insert: ${error.message}`)
    locationId = created.id
    console.log(`   Ubicación WH-001 creada: ${locationId}`)
  } else {
    console.log(`   Ubicación: ${loc?.name ?? 'WH-001'} (${locationId})`)
  }

  // Check current balance
  const { data: balance } = await supabase
    .from('inventory_balances')
    .select('id, on_hand')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .maybeSingle()

  if (balance) {
    console.log(`   Stock actual: ${balance.on_hand} unidades — ya existente, no se modifica.`)
    console.log('   Para ajustar el stock usa /admin/inventory/adjustments/new')
    return locationId
  }

  // Use record_inventory_movement (SECURITY DEFINER)
  const { error } = await supabase.rpc('record_inventory_movement', {
    p_product_id:    productId,
    p_location_id:   locationId,
    p_movement_type: 'adjustment',
    p_quantity:      25,
    p_reason:        'initial_stock',
    p_notes:         'Stock inicial — DJI Mic Mini (25 unidades)',
    p_created_by:    null,
  })

  if (error) {
    console.warn(`   ⚠ record_inventory_movement: ${error.message}`)
    console.warn('   Intentando upsert directo en inventory_balances...')

    const { error: balError } = await supabase.from('inventory_balances').upsert(
      { product_id: productId, location_id: locationId, on_hand: 25, reserved: 0 },
      { onConflict: 'product_id,location_id' }
    )
    if (balError) throw new Error(`inventory_balances upsert: ${balError.message}`)
    console.log('✅ Balance directo: 25 unidades')
  } else {
    console.log('✅ Stock registrado via record_inventory_movement: 25 unidades')
  }

  return locationId
}

// ─── 6. Verificación ─────────────────────────────────────────────────────────

async function verify(productId) {
  console.log('\n🔍 Verificando...')

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, slug, sku, sale_price, promotional_price,
      is_published, is_featured, status,
      categories (name),
      product_images (storage_path, is_primary, alt_text),
      inventory_balances (on_hand, reserved)
    `)
    .eq('id', productId)
    .single()

  if (!product) {
    console.error('❌ Producto no encontrado en verificación.')
    return
  }

  const imgs    = (product.product_images ?? [])
  const primary = imgs.find(i => i.is_primary) ?? imgs[0]
  const bal     = (product.inventory_balances ?? [])[0]

  const discount = Math.round((1 - product.promotional_price / product.sale_price) * 100)

  const imgUrl = primary
    ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${primary.storage_path}`
    : 'SIN IMAGEN'

  console.log('')
  console.log('═══════════════════════════════════════')
  console.log(' RESULTADO')
  console.log('═══════════════════════════════════════')
  console.log(` Nombre:       ${product.name}`)
  console.log(` ID:           ${product.id}`)
  console.log(` Slug:         ${product.slug}`)
  console.log(` SKU:          ${product.sku}`)
  console.log(` Categoría:    ${product.categories?.name ?? '—'}`)
  console.log(` Precio base:  USD ${product.sale_price} (tachado)`)
  console.log(` Precio promo: USD ${product.promotional_price} (activo)`)
  console.log(` Descuento:    −${discount}%`)
  console.log(` Publicado:    ${product.is_published ? '✅' : '❌'}`)
  console.log(` Activo:       ${product.status === 'active' ? '✅' : '❌'}`)
  console.log(` Destacado:    ${product.is_featured ? '✅' : '❌'}`)
  console.log(` Stock:        ${bal?.on_hand ?? 0} unidades`)
  console.log(` Imagen:       ${imgUrl}`)
  console.log('═══════════════════════════════════════')

  // Verify image URL is reachable
  try {
    const fetch = (await import('node:fetch')).default ?? globalThis.fetch
    const r = await fetch(imgUrl, { method: 'HEAD' })
    console.log(` Imagen HTTP:  ${r.status === 200 ? '✅ 200 OK' : `❌ ${r.status}`}`)
  } catch {
    console.log(` Imagen HTTP:  (no verificada — comprueba manualmente)`)
  }

  console.log('')
  console.log('🌐 Dashboard:  http://localhost:3000/admin/catalog/products/' + productId)
  console.log('🛍  Frontend:   http://localhost:3000/product/dji-mic-mini')
  console.log('📋 Categoría:  http://localhost:3000/catalog?category=audio')
  console.log('')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Seed: DJI Mic Mini\n')

  try {
    await processAndUploadImage()
    const categoryId = await upsertCategory()
    const productId  = await upsertProduct(categoryId)
    await linkImage(productId)
    await setupInventory(productId)
    await verify(productId)
    console.log('✅ Seed completado exitosamente.\n')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
