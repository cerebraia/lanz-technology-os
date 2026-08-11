// Datos públicos del catálogo.
// Usa service_role + filtros explícitos hasta que migration 009 esté aplicada.
// Nunca selecciona reference_cost ni unit_cost.
import { createStoreClient } from '@/lib/supabase/store-server'
import { getPublicImageUrl } from '@/lib/utils/storage'

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export type StoreProductImage = {
  id:           string
  storage_path: string
  alt_text:     string | null
  is_primary:   boolean
  sort_order:   number
  url:          string
}

export type StoreProduct = {
  id:                       string
  name:                     string
  slug:                     string
  sku:                      string
  sale_price:               number
  promotional_price:        number | null
  currency_code:            string
  short_description:        string | null
  is_featured:              boolean
  brand:                    string | null
  primaryImageUrl:          string | null
  category:                 { id: string; name: string; slug: string } | null
  cash_price_usd:           number | null
  bcv_reference_price_usd:  number | null
}

export type StoreProductDetail = StoreProduct & {
  description: string | null
  model:       string | null
  images:      StoreProductImage[]
  youtube_url: string | null
  inStock:     boolean
}

export type StoreSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_az'

export type StoreProductFilters = {
  categorySlug?: string
  brand?:        string
  sale?:         boolean
  sort?:         StoreSort
  search?:       string
  featured?:     boolean
}

// ─── Helpers internos ──────────────────────────────────────────────────────────

const PUBLIC_PRODUCT_COLS = `
  id, name, slug, sku, sale_price, promotional_price, currency_code,
  short_description, is_featured, brand,
  cash_price_usd, bcv_reference_price_usd,
  categories(id, name, slug),
  product_images(id, storage_path, alt_text, is_primary, sort_order)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToStoreProduct(raw: any): StoreProduct {
  const imgs: { storage_path: string; is_primary: boolean; sort_order: number }[] =
    raw.product_images ?? []
  const primary =
    imgs.find(i => i.is_primary) ??
    [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0]

  return {
    id:                       raw.id,
    name:                     raw.name,
    slug:                     raw.slug,
    sku:                      raw.sku,
    sale_price:               raw.sale_price,
    promotional_price:        raw.promotional_price,
    currency_code:            raw.currency_code,
    short_description:        raw.short_description,
    is_featured:              raw.is_featured,
    brand:                    raw.brand,
    primaryImageUrl:          primary ? getPublicImageUrl(primary.storage_path) : null,
    category:                 raw.categories ?? null,
    cash_price_usd:           raw.cash_price_usd ?? null,
    bcv_reference_price_usd:  raw.bcv_reference_price_usd ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(query: any, sort: StoreSort | undefined): any {
  switch (sort) {
    case 'price_asc':  return query.order('sale_price', { ascending: true })
    case 'price_desc': return query.order('sale_price', { ascending: false })
    case 'name_az':    return query.order('name',       { ascending: true })
    case 'newest':     return query.order('created_at', { ascending: false })
    case 'featured':
    default:
      return query
        .order('is_featured', { ascending: false })
        .order('created_at',  { ascending: false })
  }
}

// ─── Queries públicas ─────────────────────────────────────────────────────────

export async function getPublishedProducts(
  filters?: StoreProductFilters,
  page    = 1,
  pageSize = 24
): Promise<{ products: StoreProduct[]; total: number }> {
  try {
    const supabase = createStoreClient()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    // service_role bypassa RLS — los filtros de visibilidad deben ser explícitos
    let query = supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLS, { count: 'exact' })
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)

    // Filtro de categoría: busca primero el category_id por slug
    if (filters?.categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.categorySlug)
        .eq('is_active', true)
        .maybeSingle()
      if (cat?.id) {
        query = query.eq('category_id', cat.id)
      } else {
        // Categoría no válida → sin resultados
        return { products: [], total: 0 }
      }
    }

    if (filters?.brand) {
      query = query.ilike('brand', filters.brand)
    }
    if (filters?.sale) {
      query = query.not('promotional_price', 'is', null)
    }
    if (filters?.featured) {
      query = query.eq('is_featured', true)
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`
      )
    }

    query = applySort(query, filters?.sort)
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) return { products: [], total: 0 }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { products: (data as any[]).map(mapToStoreProduct), total: count ?? 0 }
  } catch {
    return { products: [], total: 0 }
  }
}

export async function getFeaturedProducts(limit = 8): Promise<StoreProduct[]> {
  try {
    const supabase = createStoreClient()

    // 1. Productos destacados
    const { data: featuredData, error: featuredError } = await supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLS)
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (featuredError) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const featured = (featuredData as any[]).map(mapToStoreProduct)
    if (featured.length >= limit) return featured

    // 2. Fallback: completar con publicados recientes (sin duplicar destacados)
    const remaining    = limit - featured.length
    const featuredIds  = new Set(featured.map(p => p.id))

    const { data: recentData, error: recentError } = await supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLS)
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .eq('is_featured', false)
      .order('created_at', { ascending: false })
      .limit(remaining)

    if (recentError || !recentData) return featured

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recent = (recentData as any[])
      .map(mapToStoreProduct)
      .filter(p => !featuredIds.has(p.id))
      .slice(0, remaining)

    return [...featured, ...recent]
  } catch {
    return []
  }
}

export async function getPublishedProductBySlug(slug: string): Promise<StoreProductDetail | null> {
  try {
    const supabase = createStoreClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, sku, sale_price, promotional_price, currency_code,
        short_description, description, model, is_featured, brand, youtube_url,
        cash_price_usd, bcv_reference_price_usd,
        categories(id, name, slug),
        product_images(id, storage_path, alt_text, is_primary, sort_order)
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .maybeSingle()

    if (error || !data) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = data as any
    const base = mapToStoreProduct(raw)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images: StoreProductImage[] = ((raw.product_images ?? []) as any[])
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary)  return 1
        return a.sort_order - b.sort_order
      })
      .map(img => ({ ...img, url: getPublicImageUrl(img.storage_path) }))

    return {
      ...base,
      description: raw.description ?? null,
      model:       raw.model       ?? null,
      youtube_url: raw.youtube_url ?? null,
      images,
      inStock: true,
    }
  } catch {
    return null
  }
}

export async function getRelatedProducts(
  productId:  string,
  categoryId: string | null,
  limit = 4
): Promise<StoreProduct[]> {
  if (!categoryId) return []
  try {
    const supabase = createStoreClient()
    const { data, error } = await supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLS)
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .eq('category_id', categoryId)
      .neq('id', productId)
      .order('is_featured', { ascending: false })
      .order('created_at',  { ascending: false })
      .limit(limit)

    if (error) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(mapToStoreProduct)
  } catch {
    return []
  }
}

export async function searchPublishedProducts(q: string, limit = 20): Promise<StoreProduct[]> {
  if (!q.trim()) return []
  try {
    const supabase = createStoreClient()
    const { data, error } = await supabase
      .from('products')
      .select(PUBLIC_PRODUCT_COLS)
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`)
      .order('is_featured', { ascending: false })
      .order('created_at',  { ascending: false })
      .limit(limit)

    if (error) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(mapToStoreProduct)
  } catch {
    return []
  }
}

export async function getDistinctBrands(): Promise<string[]> {
  try {
    const supabase = createStoreClient()
    const { data } = await supabase
      .from('products')
      .select('brand')
      .eq('is_published', true)
      .eq('status', 'active')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .not('brand', 'is', null)

    const brands = [
      ...new Set((data ?? []).map(r => r.brand).filter(Boolean) as string[]),
    ]
    return brands.sort()
  } catch {
    return []
  }
}
