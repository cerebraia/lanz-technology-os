import { createClient } from '@/lib/supabase/server'

export type ProductWithStock = {
  id:        string
  name:      string
  sku:       string
  salePrice: number
  currency:  string
  available: number
}

export async function getProductsWithStock(): Promise<ProductWithStock[]> {
  const supabase = await createClient()

  const { data: location } = await supabase
    .from('inventory_locations')
    .select('id')
    .eq('is_active', true)
    .order('code')
    .limit(1)
    .single()

  if (!location) return []

  const [productsRes, balancesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, sale_price, currency_code')
      .is('archived_at', null)
      .eq('is_published', true)
      .order('name'),
    supabase
      .from('inventory_balances')
      .select('product_id, on_hand, reserved')
      .eq('location_id', location.id),
  ])

  const products  = productsRes.data  ?? []
  const balances  = balancesRes.data  ?? []
  const balanceMap = new Map(balances.map((b) => [b.product_id, b]))

  return products.map((p) => {
    const bal = balanceMap.get(p.id)
    const available = bal ? bal.on_hand - bal.reserved : 0
    return {
      id:        p.id,
      name:      p.name,
      sku:       p.sku,
      salePrice: p.sale_price ?? 0,
      currency:  p.currency_code ?? 'USD',
      available: Math.max(available, 0),
    }
  })
}
