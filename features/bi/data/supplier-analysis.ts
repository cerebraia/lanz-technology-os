import { createClient } from '@/lib/supabase/server'

export type SupplierRow = {
  supplierName:  string
  orderCount:    number
  totalInvested: number
  avgOrderValue: number
  unitsBought:   number
  productCount:  number
  lastOrderDate: string | null
}

export async function getSupplierAnalysis(): Promise<SupplierRow[]> {
  const supabase = await createClient()

  const [ordersRes, itemsRes] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('id, supplier_name, subtotal, created_at, status')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false }),
    supabase
      .from('purchase_order_items')
      .select('purchase_order_id, product_id, quantity, total'),
  ])

  const orders = ordersRes.data ?? []
  const items  = itemsRes.data  ?? []

  const agg: Record<string, SupplierRow> = {}

  for (const order of orders) {
    const name = order.supplier_name ?? 'Sin proveedor'
    if (!agg[name]) {
      agg[name] = {
        supplierName:  name,
        orderCount:    0,
        totalInvested: 0,
        avgOrderValue: 0,
        unitsBought:   0,
        productCount:  0,
        lastOrderDate: null,
      }
    }
    agg[name].orderCount    += 1
    agg[name].totalInvested += order.subtotal

    if (!agg[name].lastOrderDate || order.created_at > agg[name].lastOrderDate!) {
      agg[name].lastOrderDate = order.created_at
    }
  }

  // Process items per order
  const orderSupplierMap: Record<string, string> = {}
  for (const o of orders) {
    orderSupplierMap[o.id] = o.supplier_name ?? 'Sin proveedor'
  }

  const productsBySupplier: Record<string, Set<string>> = {}
  for (const item of items) {
    const sn = orderSupplierMap[item.purchase_order_id]
    if (!sn || !agg[sn]) continue
    agg[sn].unitsBought += item.quantity
    if (!productsBySupplier[sn]) productsBySupplier[sn] = new Set()
    if (item.product_id) productsBySupplier[sn].add(item.product_id)
  }

  for (const [name, row] of Object.entries(agg)) {
    row.avgOrderValue = row.orderCount > 0 ? row.totalInvested / row.orderCount : 0
    row.productCount  = productsBySupplier[name]?.size ?? 0
  }

  return Object.values(agg).sort((a, b) => b.totalInvested - a.totalInvested)
}
