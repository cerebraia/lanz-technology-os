/**
 * Seed script: DJI Osmo Pocket 3
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-dji-osmo-pocket-3.mjs
 *
 * Requiere:
 *   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 *
 * Este script:
 *   1. Verifica el estado actual del producto archivado existente
 *   2. Actualiza SKU, descripción y campos comerciales
 *   3. Optimiza la imagen → WebP 800×800 px con padding blanco (sin recorte)
 *   4. Sube al bucket catalog-images y registra en product_images
 *   5. Registra el stock inicial de 8 unidades via opening_balance
 *   6. Reactiva y publica el producto
 *   7. Verifica el resultado final
 */

import { existsSync }   from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ Faltan variables de entorno.')
  console.error('   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env.local\n')
  process.exit(1)
}

// ID del producto archivado existente (verificado antes de ejecutar)
const PRODUCT_ID   = '6f0fff1d-c041-4843-8221-34aa8ad4e90f'
const SOURCE_IMAGE = '/Users/fernandao2307/Downloads/a0377e94f198ff8314f4ca8f066a6479.png'
const STORAGE_PATH = 'products/dji-osmo-pocket-3/dji-osmo-pocket-3-principal.webp'
const BUCKET       = 'catalog-images'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── 1. Verificación previa ───────────────────────────────────────────────────

async function verifyStartConditions() {
  console.log('\n🔍 Verificando condiciones iniciales...')

  if (!existsSync(SOURCE_IMAGE)) {
    console.error(`❌ Imagen no encontrada: ${SOURCE_IMAGE}`)
    process.exit(1)
  }
  console.log(`   Imagen fuente: OK (${SOURCE_IMAGE})`)

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, sku, slug, status, is_published, sale_price, archived_at')
    .eq('id', PRODUCT_ID)
    .single()

  if (error || !product) {
    console.error(`❌ Producto no encontrado (${PRODUCT_ID}): ${error?.message}`)
    process.exit(1)
  }

  console.log(`   Producto: ${product.name} (${product.sku}) — status: ${product.status}`)

  // Verificar que el nuevo SKU no esté en uso por otro producto
  const { data: skuConflict } = await supabase
    .from('products')
    .select('id')
    .eq('sku', 'DJI-OSMO-POCKET-3')
    .neq('id', PRODUCT_ID)
    .maybeSingle()

  if (skuConflict) {
    console.error(`❌ El SKU DJI-OSMO-POCKET-3 ya está en uso por otro producto (${skuConflict.id})`)
    process.exit(1)
  }
  console.log('   SKU DJI-OSMO-POCKET-3: disponible')

  return product
}

// ─── 2. Imagen ────────────────────────────────────────────────────────────────

async function processAndUploadImage() {
  console.log('\n📸 Procesando imagen...')

  const sharp = (await import('../node_modules/sharp/lib/index.js')).default

  // La imagen fuente es 1192×1200 (casi cuadrada).
  // fit: 'contain' agrega padding blanco para cuadrar sin recortar ni deformar.
  const webpBuffer = await sharp(SOURCE_IMAGE)
    .resize(800, 800, {
      fit:                'contain',
      withoutEnlargement: false,
      background:         { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85, effort: 4 })
    .toBuffer()

  console.log(`   Tamaño WebP resultante: ${(webpBuffer.length / 1024).toFixed(1)} KB`)

  // Verificar si ya existe en Storage
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list('products/dji-osmo-pocket-3')

  const alreadyUploaded = (existing ?? []).some(
    f => f.name === 'dji-osmo-pocket-3-principal.webp'
  )

  if (alreadyUploaded) {
    console.log('   Imagen ya existe en Storage — omitiendo subida.')
  } else {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(STORAGE_PATH, webpBuffer, { contentType: 'image/webp', upsert: false })

    if (uploadError) {
      if (
        uploadError.message.includes('already exists') ||
        uploadError.message.includes('duplicate')
      ) {
        console.log('   Imagen existente — actualizando con upsert...')
        const { error: upsertError } = await supabase.storage
          .from(BUCKET)
          .upload(STORAGE_PATH, webpBuffer, { contentType: 'image/webp', upsert: true })
        if (upsertError) throw new Error(`Storage upload: ${upsertError.message}`)
      } else {
        throw new Error(`Storage upload: ${uploadError.message}`)
      }
    }
    console.log(`✅ Imagen subida: ${STORAGE_PATH}`)
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${STORAGE_PATH}`
  console.log(`   URL pública: ${publicUrl}`)
  return publicUrl
}

// ─── 3. Actualizar producto ───────────────────────────────────────────────────

async function updateProduct() {
  console.log('\n📦 Actualizando producto...')

  const description = [
    'La DJI Osmo Pocket 3 es una cámara compacta diseñada para creadores de contenido que buscan calidad profesional en un formato portátil. Incorpora un sensor CMOS de 1 pulgada, grabación 4K hasta 120 fps, estabilización mecánica de tres ejes y una pantalla táctil giratoria de 2 pulgadas.',
    '',
    'Gracias a ActiveTrack 6.0, permite mantener sujetos en seguimiento automático durante la grabación. Ideal para redes sociales, viajes, entrevistas y producciones audiovisuales.',
    '',
    'Características:',
    '- Sensor CMOS de 1 pulgada.',
    '- Grabación 4K hasta 120 fps en cámara lenta.',
    '- Estabilización mecánica de tres ejes.',
    '- Pantalla táctil giratoria de 2 pulgadas.',
    '- ActiveTrack 6.0.',
    '- Diseño compacto y portátil.',
    '',
    'Beneficios comerciales:',
    '- Equipo 100% original DJI.',
    '- Delivery gratis en Caracas.',
    '- Envíos a toda Venezuela.',
    '- Incluye de obsequio: 1 DJI Mic Mini blanco (1TX).',
  ].join('\n')

  const shortDescription =
    'Cámara compacta con sensor CMOS de 1 pulgada, grabación 4K/120fps, ' +
    'estabilización mecánica de 3 ejes y ActiveTrack 6.0. ' +
    'Incluye de obsequio 1 DJI Mic Mini blanco (1TX).'

  const { error } = await supabase
    .from('products')
    .update({
      sku:               'DJI-OSMO-POCKET-3',
      name:              'DJI Osmo Pocket 3',
      short_description: shortDescription,
      description,
      sale_price:        800.00,
      promotional_price: null,
      currency_code:     'USD',
      brand:             'DJI',
      model:             'Osmo Pocket 3',
      status:            'active',
      is_published:      true,
      is_featured:       true,
      track_inventory:   true,
      min_stock:         2,
      archived_at:       null,
      // Preservar published_at original; si era null, fijar ahora
      published_at:      new Date().toISOString(),
    })
    .eq('id', PRODUCT_ID)

  if (error) throw new Error(`Product update: ${error.message}`)
  console.log(`✅ Producto actualizado (SKU → DJI-OSMO-POCKET-3, status → active, published)`)
}

// ─── 4. Imagen en product_images ─────────────────────────────────────────────

async function linkImage() {
  console.log('\n🖼  Vinculando imagen al producto...')

  const { data: existing } = await supabase
    .from('product_images')
    .select('id, storage_path, is_primary')
    .eq('product_id', PRODUCT_ID)
    .eq('storage_path', STORAGE_PATH)
    .maybeSingle()

  if (existing) {
    if (!existing.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', PRODUCT_ID)
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', existing.id)
      console.log('   Registro existente — marcado como principal.')
    } else {
      console.log('   Imagen ya registrada como principal.')
    }
    return
  }

  // Quitar flag principal de cualquier otra imagen previa
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', PRODUCT_ID)
    .eq('is_primary', true)

  const { error } = await supabase.from('product_images').insert({
    product_id:   PRODUCT_ID,
    storage_path: STORAGE_PATH,
    alt_text:     'DJI Osmo Pocket 3, cámara compacta con sensor de 1 pulgada y estabilización de 3 ejes',
    sort_order:   0,
    is_primary:   true,
  })

  if (error) throw new Error(`product_images insert: ${error.message}`)
  console.log('✅ Imagen registrada como principal')
}

// ─── 5. Inventario ────────────────────────────────────────────────────────────

async function setupInventory() {
  console.log('\n📊 Registrando inventario...')

  // Obtener ubicación WH-001
  const { data: loc } = await supabase
    .from('inventory_locations')
    .select('id, name, code')
    .eq('code', 'WH-001')
    .maybeSingle()

  if (!loc) throw new Error('Ubicación WH-001 no encontrada.')
  console.log(`   Ubicación: ${loc.name} (${loc.id})`)

  // Verificar si ya existe balance para este producto
  const { data: balance } = await supabase
    .from('inventory_balances')
    .select('id, on_hand, reserved')
    .eq('product_id', PRODUCT_ID)
    .eq('location_id', loc.id)
    .maybeSingle()

  if (balance) {
    console.log(
      `   Balance existente: ${balance.on_hand} unidades en mano, ` +
      `${balance.reserved} reservadas — no se modifica.`
    )
    console.log('   Para ajustar usa /admin/inventory/adjustments/new')
    return
  }

  // Registrar opening_balance via función SECURITY DEFINER
  const { error } = await supabase.rpc('record_inventory_movement', {
    p_product_id:    PRODUCT_ID,
    p_location_id:   loc.id,
    p_movement_type: 'opening_balance',
    p_quantity:      8,
    p_reason:        'initial_stock',
    p_notes:         'Stock inicial — DJI Osmo Pocket 3 (8 unidades)',
    p_created_by:    null,
  })

  if (error) throw new Error(`record_inventory_movement: ${error.message}`)
  console.log('✅ Stock registrado: 8 unidades (opening_balance)')
}

// ─── 6. Verificación final ────────────────────────────────────────────────────

async function verify() {
  console.log('\n🔍 Verificación final...')

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, slug, sku, status, is_published, is_featured,
      sale_price, currency_code, short_description,
      categories (name),
      product_images (storage_path, is_primary, alt_text, sort_order),
      inventory_balances (on_hand, reserved)
    `)
    .eq('id', PRODUCT_ID)
    .single()

  if (!product) {
    console.error('❌ No se encontró el producto en la verificación final.')
    return
  }

  const imgs    = product.product_images ?? []
  const primary = imgs.find(i => i.is_primary) ?? imgs[0]
  const bal     = (product.inventory_balances ?? [])[0]
  const imgUrl  = primary
    ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${primary.storage_path}`
    : 'SIN IMAGEN'

  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log(' RESULTADO FINAL')
  console.log('═══════════════════════════════════════════════════')
  console.log(` Nombre:     ${product.name}`)
  console.log(` ID:         ${product.id}`)
  console.log(` SKU:        ${product.sku}`)
  console.log(` Slug:       ${product.slug}`)
  console.log(` Categoría:  ${product.categories?.name ?? '—'}`)
  console.log(` Precio:     ${product.currency_code} ${product.sale_price}`)
  console.log(` Status:     ${product.status}`)
  console.log(` Publicado:  ${product.is_published ? '✅' : '❌'}`)
  console.log(` Destacado:  ${product.is_featured  ? '✅' : '❌'}`)
  console.log(` Imágenes:   ${imgs.length} (principal: ${primary ? primary.storage_path : '—'})`)
  console.log(` Stock:      ${bal?.on_hand ?? 0} unidades (reservadas: ${bal?.reserved ?? 0})`)
  console.log(` Imagen URL: ${imgUrl}`)
  console.log('═══════════════════════════════════════════════════')

  // Verificar accesibilidad HTTP de la imagen
  try {
    const fetch = (await import('node:fetch')).default ?? globalThis.fetch
    const r     = await fetch(imgUrl, { method: 'HEAD' })
    console.log(` Imagen HTTP: ${r.status === 200 ? '✅ 200 OK' : `❌ ${r.status}`}`)
  } catch {
    console.log(' Imagen HTTP: (no verificada — comprueba manualmente)')
  }

  const storeUrl = `https://lanztechnology.com/product/${product.slug}`
  console.log('')
  console.log(` 🛍  Tienda:    ${storeUrl}`)
  console.log(` 📋 Admin:     https://lanztechnology.com/admin/catalog/products/${product.id}`)
  console.log('')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Importación: DJI Osmo Pocket 3 (reactivar producto archivado)\n')

  try {
    await verifyStartConditions()
    await processAndUploadImage()
    await updateProduct()
    await linkImage()
    await setupInventory()
    await verify()
    console.log('✅ Importación completada exitosamente.\n')
  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
