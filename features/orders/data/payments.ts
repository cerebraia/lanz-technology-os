import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Payment = Database['public']['Tables']['payments']['Row']

export async function getPaymentsByOrder(orderId: string): Promise<Payment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Error al obtener pagos: ${error.message}`)
  return (data ?? []) as Payment[]
}
