import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type CustomerTag = Database['public']['Tables']['customer_tags']['Row']

export async function getTags(): Promise<CustomerTag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_tags')
    .select('*')
    .order('name')
  if (error) throw new Error(`Error al obtener etiquetas: ${error.message}`)
  return (data ?? []) as CustomerTag[]
}

export async function getTagOptions(tags: CustomerTag[]) {
  return tags.map((t) => ({ value: t.id, label: t.name }))
}
