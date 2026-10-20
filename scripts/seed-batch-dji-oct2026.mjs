/**
 * Seed script: Importación batch — DJI Osmo Pocket 4P, Action 6, Osmo 360
 * Octubre 2026
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-batch-dji-oct2026.mjs
 *
 * Requiere:
 *   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 *
 * Este script:
 *   1. Verifica que los 3 SKU/slugs no existen en producción
 *   2. Crea o reutiliza las categorías requeridas
 *   3. Procesa cada imagen fuente → WebP 800×800 con padding blanco
 *   4. Sube imágenes al bucket catalog-images
 *   5. Crea los 3 productos con estado activo y publicado
 *   6. Registra inventario inicial via opening_balance
 *   7. Verifica el resultado final de los 3 productos
 */

import { existsSync }   from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌ Faltan variables de entorno (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)\n')
  process.exit(1)
}

const BUCKET   = 'catalog-images'
const DL       = '/Users/fernandao2307/Downloads'

const PRODUCTS = [
  {
    // ── DJI Osmo Pocket 4P ──────────────────────────────────────────────────
    sku:          'DJI-OSMO-POCKET-4P',
    name:         'DJI Osmo Pocket 4P',
    slug:         'dji-osmo-pocket-4p',
    brand:        'DJI',
    model:        'Osmo Pocket 4P',
    sale_price:   1400.00,
    inventory:    6,
    is_featured:  true,
    min_stock:    1,
    category:     { name: 'Cámara', slug: 'camara', create: false },
    sourceImage:  `${DL}/DJI Osmo Pocket 4P_ Vlog profesional.png`,
    storagePath:  'products/dji-osmo-pocket-4p/dji-osmo-pocket-4p-principal.webp',
    altText:      'DJI Osmo Pocket 4P, cámara compacta con doble lente y zoom óptico 3×',
    shortDescription:
      'Cámara compacta con sensor de 1 pulgada, doble lente con zoom óptico 3×, ' +
      'estabilización mecánica de 3 ejes y seguimiento inteligente de sujetos.',
    description: [
      'La DJI Osmo Pocket 4P eleva la creación de contenido compacto con una combinación ' +
      'de óptica avanzada y estabilización mecánica de primer nivel.',
      '',
      'Diseñada para vloggers, creadores y profesionales que exigen calidad cinematográfica ' +
      'en un formato que cabe en cualquier bolsillo.',
      '',
      'Características:',
      '- Sensor CMOS de 1 pulgada.',
      '- Doble lente con zoom óptico 3×.',
      '- Estabilización mecánica de 3 ejes.',
      '- Seguimiento inteligente de sujetos.',
      '- Pantalla táctil giratoria.',
      '- Diseño compacto y portátil.',
      '',
      'Beneficios comerciales:',
      '- Equipo 100% original DJI.',
      '- Delivery gratis en Caracas.',
      '- Envíos a toda Venezuela.',
      '- Asesoría personalizada.',
    ].join('\n'),
  },

  {
    // ── DJI Osmo Action 6 ───────────────────────────────────────────────────
    sku:          'DJI-OSMO-ACTION-6',
    name:         'DJI Osmo Action 6',
    slug:         'dji-osmo-action-6',
    brand:        'DJI',
    model:        'Osmo Action 6',
    sale_price:   900.00,
    inventory:    2,
    is_featured:  false,
    min_stock:    1,
    category:     { name: 'Cámaras de acción', slug: 'camaras-de-accion', create: true },
    sourceImage:  `${DL}/DJI Osmo Action 6_ Combo esencial.png`,
    storagePath:  'products/dji-osmo-action-6/dji-osmo-action-6-principal.webp',
    altText:      'DJI Osmo Action 6, cámara de acción 4K con estabilización RockSteady',
    shortDescription:
      'Cámara de acción con grabación 4K a 120 fps, estabilización RockSteady, ' +
      'resistencia al agua y pantalla frontal y trasera.',
    description: [
      'La DJI Osmo Action 6 está diseñada para capturar cada aventura con la mayor ' +
      'estabilidad y claridad, sin importar las condiciones.',
      '',
      'Ideal para deportes extremos, viajes, actividades al aire libre y contenido ' +
      'de alto impacto para redes sociales.',
      '',
      'Características:',
      '- Grabación 4K a 120 fps.',
      '- Estabilización RockSteady.',
      '- Resistente al agua.',
      '- Pantalla frontal y trasera.',
      '',
      'Beneficios comerciales:',
      '- Equipo 100% original DJI.',
      '- Delivery gratis en Caracas.',
      '- Envíos a toda Venezuela.',
      '- Asesoría personalizada.',
    ].join('\n'),
  },

  {
    // ── DJI Osmo 360 ────────────────────────────────────────────────────────
    sku:          'DJI-OSMO-360',
    name:         'DJI Osmo 360',
    slug:         'dji-osmo-360',
    brand:        'DJI',
    model:        'Osmo 360',
    sale_price:   800.00,
    inventory:    2,
    is_featured:  false,
    min_stock:    1,
    category:     { name: 'Cámaras 360°', slug: 'camaras-360', create: true },
    sourceImage:  `${DL}/DJI Osmo 360_ Captura Sin Límites.png`,
    storagePath:  'products/dji-osmo-360/dji-osmo-360-principal.webp',
    altText:      'DJI Osmo 360, cámara de video 8K en 360° con estabilización HorizonSteady',
    shortDescription:
      'Cámara 360° con video 8K, doble lente de alta resolución, estabilización ' +
      'HorizonSteady y fotografías inmersivas en ultra alta resolución.',
    description: [
      'La DJI Osmo 360 captura la realidad completa en video 8K inmersivo, con una ' +
      'estabilización avanzada que elimina el horizonte inestable en cualquier movimiento.',
      '',
      'Perfecta para creadores que buscan narrativas envolventes, tours virtuales, ' +
      'cobertura de eventos y producción audiovisual de alto nivel.',
      '',
      'Características:',
      '- Video 8K en 360°.',
      '- Doble lente de alta calidad.',
      '- Estabilización avanzada HorizonSteady.',
      '- Fotografías de 360° en ultra alta resolución.',
      '',
      'Beneficios comerciales:',
      '- Equipo 100% original DJI.',
      '- Delivery gratis en Caracas.',
      '- Envíos a toda Venezuela.',
      '- Asesoría personalizada.',
    ].join('\n'),
  },
]

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSharp() {
  return (await import('../node_modules/sharp/lib/index.js')).default
}

// ─── 1. Verificación previa global ───────────────────────────────────────────

async function verifyNoConflicts() {
  console.log('\n🔍 Verificando conflictos de SKU y slug...')

  const skus  = PRODUCTS.map(p => p.sku)
  const slugs = PRODUCTS.map(p => p.slug)

  const [{ data: bySku }, { data: bySlug }] = await Promise.all([
    supabase.from('products').select('id,sku,name').in('sku', skus),
    supabase.from('products').select('id,slug,name').in('slug', slugs),
  ])

  const conflicts = [
    ...(bySku  ?? []).map(r => `SKU ${r.sku} ya existe (${r.name})`),
    ...(bySlug ?? []).map(r => `Slug ${r.slug} ya existe (${r.name})`),
  ]

  if (conflicts.length) {
    console.error('❌ Conflictos encontrados:')
    conflicts.forEach(c => console.error(`   ${c}`))
    process.exit(1)
  }

  console.log('   Sin conflictos de SKU ni slug ✅')
}

// ─── 2. Verificar imágenes fuente ─────────────────────────────────────────────

function verifySourceImages() {
  console.log('\n🖼  Verificando imágenes fuente...')
  for (const p of PRODUCTS) {
    if (!existsSync(p.sourceImage)) {
      console.error(`❌ Imagen no encontrada para ${p.name}:\n   ${p.sourceImage}`)
      process.exit(1)
    }
    console.log(`   ${p.name}: OK`)
  }
}

// ─── 3. Obtener o crear categoría ─────────────────────────────────────────────

async function upsertCategory(cat) {
  const { data: existing } = await supabase
    .from('categories')
    .select('id, name, is_active')
    .ilike('name', cat.name)
    .maybeSingle()

  if (existing) {
    if (!existing.is_active) {
      await supabase.from('categories').update({ is_active: true }).eq('id', existing.id)
      console.log(`   Categoría reactivada: ${existing.name}`)
    } else {
      console.log(`   Categoría existente: ${existing.name} (${existing.id})`)
    }
    return existing.id
  }

  if (!cat.create) {
    console.error(`❌ Categoría "${cat.name}" no existe y create=false`)
    process.exit(1)
  }

  const { data: created, error } = await supabase
    .from('categories')
    .insert({ name: cat.name, slug: cat.slug, is_active: true, sort_order: 20 })
    .select('id')
    .single()

  if (error) throw new Error(`Category insert (${cat.name}): ${error.message}`)
  console.log(`   Categoría creada: ${cat.name} (${created.id})`)
  return created.id
}

// ─── 4. Procesar y subir imagen ───────────────────────────────────────────────

async function processAndUploadImage(product, sharp) {
  const { sourceImage, storagePath, name } = product

  // fit: contain + fondo blanco = cuadrar sin recortar ni deformar
  const webpBuffer = await sharp(sourceImage)
    .resize(800, 800, {
      fit:                'contain',
      withoutEnlargement: false,
      background:         { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85, effort: 4 })
    .toBuffer()

  console.log(`   ${name}: ${(webpBuffer.length / 1024).toFixed(1)} KB WebP`)

  const folder = storagePath.split('/').slice(0, -1).join('/')
  const file   = storagePath.split('/').pop()

  const { data: existing } = await supabase.storage.from(BUCKET).list(folder)
  const alreadyUploaded = (existing ?? []).some(f => f.name === file)

  if (alreadyUploaded) {
    console.log(`   ${name}: imagen ya existe en Storage — omitiendo.`)
    return
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, webpBuffer, { contentType: 'image/webp', upsert: false })

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      const { error: e2 } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, webpBuffer, { contentType: 'image/webp', upsert: true })
      if (e2) throw new Error(`Storage upsert (${name}): ${e2.message}`)
    } else {
      throw new Error(`Storage upload (${name}): ${error.message}`)
    }
  }
  console.log(`   ${name}: subida ✅`)
}

// ─── 5. Crear producto ────────────────────────────────────────────────────────

async function createProduct(product, categoryId) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: created, error } = await supabase
    .from('products')
    .insert({
      sku:               product.sku,
      name:              product.name,
      slug:              product.slug,
      short_description: product.shortDescription,
      description:       product.description,
      brand:             product.brand,
      model:             product.model,
      sale_price:        product.sale_price,
      promotional_price: null,
      currency_code:     'USD',
      category_id:       categoryId,
      status:            'active',
      is_published:      true,
      is_featured:       product.is_featured,
      track_inventory:   true,
      min_stock:         product.min_stock,
      published_at:      new Date().toISOString(),
      created_by:        user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Product insert (${product.name}): ${error.message}`)
  return created.id
}

// ─── 6. Vincular imagen ───────────────────────────────────────────────────────

async function linkImage(productId, product) {
  const { data: existing } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .eq('storage_path', product.storagePath)
    .maybeSingle()

  if (existing) {
    console.log(`   ${product.name}: imagen ya registrada.`)
    return
  }

  const { error } = await supabase.from('product_images').insert({
    product_id:   productId,
    storage_path: product.storagePath,
    alt_text:     product.altText,
    sort_order:   0,
    is_primary:   true,
  })

  if (error) throw new Error(`product_images insert (${product.name}): ${error.message}`)
  console.log(`   ${product.name}: imagen registrada como principal ✅`)
}

// ─── 7. Registrar inventario ──────────────────────────────────────────────────

async function setupInventory(productId, product, locationId) {
  const { data: existing } = await supabase
    .from('inventory_balances')
    .select('on_hand')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .maybeSingle()

  if (existing) {
    console.log(`   ${product.name}: balance existente (${existing.on_hand} uds) — sin cambios.`)
    return
  }

  const { error } = await supabase.rpc('record_inventory_movement', {
    p_product_id:    productId,
    p_location_id:   locationId,
    p_movement_type: 'opening_balance',
    p_quantity:      product.inventory,
    p_reason:        'initial_stock',
    p_notes:         `Stock inicial — ${product.name} (${product.inventory} unidades)`,
    p_created_by:    null,
  })

  if (error) throw new Error(`record_inventory_movement (${product.name}): ${error.message}`)
  console.log(`   ${product.name}: ${product.inventory} unidades registradas (opening_balance) ✅`)
}

// ─── 8. Verificación final ────────────────────────────────────────────────────

async function verifyAll(results) {
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(' RESULTADO FINAL')
  console.log('═══════════════════════════════════════════════════════════════')

  const ids = results.map(r => r.id)

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, sku, slug, status, is_published, is_featured,
      sale_price, currency_code,
      categories (name),
      product_images (storage_path, is_primary),
      inventory_balances (on_hand, reserved)
    `)
    .in('id', ids)

  let totalInventory = 0

  for (const p of (products ?? [])) {
    const bal     = (p.inventory_balances ?? [])[0]
    const primary = (p.product_images ?? []).find(i => i.is_primary)
    const imgUrl  = primary
      ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${primary.storage_path}`
      : 'SIN IMAGEN'

    totalInventory += bal?.on_hand ?? 0

    console.log(`\n ${p.name}`)
    console.log(`   SKU:        ${p.sku}`)
    console.log(`   Slug:       ${p.slug}`)
    console.log(`   Categoría:  ${p.categories?.name ?? '—'}`)
    console.log(`   Precio:     ${p.currency_code} ${p.sale_price}`)
    console.log(`   Status:     ${p.status} / publicado: ${p.is_published ? '✅' : '❌'} / destacado: ${p.is_featured ? '✅' : '—'}`)
    console.log(`   Stock:      ${bal?.on_hand ?? 0} uds (reservadas: ${bal?.reserved ?? 0})`)
    console.log(`   Imagen:     ${imgUrl}`)
    console.log(`   Tienda:     https://lanztechnology.com/product/${p.slug}`)
  }

  console.log('\n───────────────────────────────────────────────────────────────')
  console.log(` Total inventario importado: ${totalInventory} unidades`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  // Verificar HTTP de las páginas públicas
  console.log('🌐 Verificando accesibilidad pública...')
  const fetch = (await import('node:fetch')).default ?? globalThis.fetch
  for (const p of (products ?? [])) {
    try {
      const r = await fetch(`https://lanztechnology.com/product/${p.slug}`, { method: 'HEAD' })
      console.log(`   /product/${p.slug}: ${r.status === 200 ? '✅ 200 OK' : `❌ ${r.status}`}`)
    } catch {
      console.log(`   /product/${p.slug}: (no verificada)`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Importación batch: DJI Osmo Pocket 4P · Action 6 · Osmo 360\n')

  try {
    // Verificaciones previas
    await verifyNoConflicts()
    verifySourceImages()

    // Obtener ubicación WH-001
    const { data: loc } = await supabase
      .from('inventory_locations')
      .select('id, name')
      .eq('code', 'WH-001')
      .maybeSingle()

    if (!loc) throw new Error('Ubicación WH-001 no encontrada.')
    console.log(`\n📍 Ubicación: ${loc.name} (${loc.id})`)

    // Cargar sharp una sola vez
    const sharp = await getSharp()

    const results = []

    for (const product of PRODUCTS) {
      console.log(`\n──────────────────────────────────────────`)
      console.log(` Importando: ${product.name}`)
      console.log('──────────────────────────────────────────')

      // Categoría
      console.log('\n📁 Categoría...')
      const categoryId = await upsertCategory(product.category)

      // Imagen
      console.log('\n📸 Imagen...')
      await processAndUploadImage(product, sharp)

      // Crear producto
      console.log('\n📦 Creando producto...')
      const productId = await createProduct(product, categoryId)
      console.log(`   ID: ${productId}`)

      // Vincular imagen
      await linkImage(productId, product)

      // Inventario
      console.log('\n📊 Inventario...')
      await setupInventory(productId, product, loc.id)

      results.push({ id: productId, slug: product.slug })
    }

    await verifyAll(results)
    console.log('✅ Importación batch completada.\n')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    process.exit(1)
  }
}

main()
