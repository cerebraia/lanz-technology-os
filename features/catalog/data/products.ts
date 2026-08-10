import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']

export type ProductWithCategory = Product & {
  categories: Pick<
    Database['public']['Tables']['categories']['Row'],
    'id' | 'name' | 'slug'
  > | null
}

export type ProductImage = Database['public']['Tables']['product_images']['Row']

export type ProductFilters = {
  status?:      string
  search?:      string
  categoryId?:  string
  isPublished?: boolean
  hasPromo?:    boolean
}

const PAGE_SIZE = 25

export async function getProducts(filters?: ProductFilters, page = 1) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('products')
    .select('*, categories(id, name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Archived products have archived_at set; exclude them from non-archived views
  if (filters?.status === 'archived') {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  if (filters?.status)     query = query.eq('status', filters.status)
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    )
  }
  if (filters?.isPublished !== undefined)
    query = query.eq('is_published', filters.isPublished)
  if (filters?.hasPromo)
    query = query.not('promotional_price', 'is', null)

  const { data, error, count } = await query
  if (error) throw new Error(`Error al obtener productos: ${error.message}`)

  return {
    products: data as ProductWithCategory[],
    total:    count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    pages:    Math.ceil((count ?? 0) / PAGE_SIZE),
  }
}

export async function getProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as ProductWithCategory
}

export async function getProductImages(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export async function getProductBySlug(slug: string, excludeId?: string) {
  const supabase = await createClient()
  let query = supabase.from('products').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return data
}

export async function getProductBySku(sku: string, excludeId?: string) {
  const supabase = await createClient()
  let query = supabase.from('products').select('id').eq('sku', sku)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return data
}
