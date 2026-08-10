import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Shipment = Database['public']['Tables']['shipments']['Row']

export async function getShipmentsByOrder(orderId: string): Promise<Shipment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Error al obtener envíos: ${error.message}`)
  return (data ?? []) as Shipment[]
}
