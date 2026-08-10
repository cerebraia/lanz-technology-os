import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/db/database.types'

export type Quote = Database['public']['Tables']['quotes']['Row']
// quote_items exists in migration 20260802000003_crm.sql but is absent from
// the generated types — local definition until `npm run db:types` is re-run
export type QuoteItem = {
  id:          string
  quote_id:    string
  product_id:  string | null
  quantity:    number
  unit_price:  number
  total:       number
}

export type QuoteWithCustomer = Quote & {
  customers?: { first_name: string; last_name: string | null } | null
  quote_items?: QuoteItem[]
}

export async function getQuotes(status?: string): Promise<QuoteWithCustomer[]> {
  const supabase = await createClient()
  let query = supabase
    .from('quotes')
    .select('*, customers(first_name, last_name), quote_items(*)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(`Error al obtener cotizaciones: ${error.message}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[] ?? []) as QuoteWithCustomer[]
}

export async function getQuoteById(id: string): Promise<QuoteWithCustomer | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quotes')
    .select('*, customers(first_name, last_name), quote_items(*)')
    .eq('id', id)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any ?? null) as QuoteWithCustomer | null
}

export async function getQuotesByCustomer(customerId: string): Promise<Quote[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Quote[]
}
