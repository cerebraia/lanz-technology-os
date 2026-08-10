import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type CustomerSegment = Database['public']['Tables']['customer_segments']['Row']

export async function getSegments(): Promise<CustomerSegment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_segments')
    .select('*')
    .order('name')
  if (error) throw new Error(`Error al obtener segmentos: ${error.message}`)
  return (data ?? []) as CustomerSegment[]
}

export async function getSegmentOptions(segments: CustomerSegment[]) {
  return [
    { value: '', label: 'Sin segmento' },
    ...segments.map((s) => ({ value: s.id, label: s.name })),
  ]
}

export async function getSegmentCustomerCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const now = new Date()
  const d30  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString()
  const d90  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString()

  const [customersData, tagsData, ordersData] = await Promise.all([
    supabase.from('customers').select('id, created_at, archived_at').is('archived_at', null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from('customer_tag_assignments').select('customer_id, customer_tags(name)') as any,
    supabase.from('orders').select('customer_id, created_at, status'),
  ])

  const customers = customersData.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagRows = (tagsData.data ?? []) as any[]
  const orders  = ordersData.data ?? []

  const customerOrderMap: Record<string, string[]> = {}
  for (const o of orders) {
    if (!o.customer_id || o.status === 'cancelled') continue
    if (!customerOrderMap[o.customer_id]) customerOrderMap[o.customer_id] = []
    customerOrderMap[o.customer_id].push(o.created_at)
  }

  const hasTag = (customerId: string, tagName: string) =>
    tagRows.some((t: { customer_id: string; customer_tags?: { name: string } | null }) =>
      t.customer_id === customerId && t.customer_tags?.name?.toLowerCase() === tagName.toLowerCase()
    )

  return {
    'Clientes VIP':        customers.filter((c) => hasTag(c.id, 'VIP')).length,
    'Clientes nuevos':     customers.filter((c) => c.created_at >= d30).length,
    'Clientes frecuentes': customers.filter((c) => (customerOrderMap[c.id]?.length ?? 0) >= 3).length,
    'Clientes inactivos':  customers.filter((c) => {
      const orderDates = customerOrderMap[c.id] ?? []
      return orderDates.length === 0 || Math.max(...orderDates.map((d) => new Date(d).getTime())) < new Date(d90).getTime()
    }).length,
    'Mayoristas':          customers.filter((c) => hasTag(c.id, 'Mayorista')).length,
    'Corporativos':        customers.filter((c) => hasTag(c.id, 'Corporativo')).length,
  }
}
