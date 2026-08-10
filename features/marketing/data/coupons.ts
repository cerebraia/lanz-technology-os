import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type DiscountCoupon = Database['public']['Tables']['discount_coupons']['Row']

export async function getCoupons(activeOnly?: boolean): Promise<DiscountCoupon[]> {
  const supabase = await createClient()
  let query = supabase
    .from('discount_coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener cupones: ${error.message}`)
  return (data ?? []) as DiscountCoupon[]
}
