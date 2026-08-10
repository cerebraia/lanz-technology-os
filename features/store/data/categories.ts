// Datos públicos de categorías.
// Usa service_role + filtros explícitos hasta que migration 009 esté aplicada.
import { createStoreClient } from '@/lib/supabase/store-server'

export type PublicCategory = {
  id:          string
  name:        string
  slug:        string
  description: string | null
  sort_order:  number
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  try {
    const supabase = createStoreClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name',       { ascending: true })

    if (error) return []
    return (data ?? []) as PublicCategory[]
  } catch {
    return []
  }
}

export async function getPublicCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  try {
    const supabase = createStoreClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, sort_order')
      .eq('slug',      slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return null
    return data as PublicCategory
  } catch {
    return null
  }
}
