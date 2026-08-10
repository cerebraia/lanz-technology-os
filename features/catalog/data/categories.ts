import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[getCategories] Supabase error:', error.message)
    return []
  }
  return data ?? []
}

export async function getCategoryById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getCategoryBySlug(slug: string, excludeId?: string) {
  const supabase = await createClient()
  let query = supabase.from('categories').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return data
}
