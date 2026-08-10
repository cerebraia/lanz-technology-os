import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type CustomerActivity = Database['public']['Tables']['customer_activity']['Row'] & {
  profiles?: { first_name: string; last_name: string | null } | null
}

export async function getCustomerActivity(customerId: string, limit = 30): Promise<CustomerActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_activity')
    .select('*, profiles(first_name, last_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Error al obtener actividad: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []) as CustomerActivity[]
}
