import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CostAllocation = {
  id:                string
  import_id:         string
  expense_id:        string | null
  allocation_method: string
  total_amount:      number
  currency:          string
  notes:             string | null
  created_at:        string
  items?: CostAllocationItem[]
}

export type CostAllocationItem = {
  id:                    string
  allocation_id:         string
  product_id:            string
  quantity:              number
  unit_merchandise_cost: number
  allocated_amount:      number
  final_unit_cost:       number
  created_at:            string
  products: { id: string; name: string; sku: string } | null
}

export type ProductForAllocation = {
  product_id:            string
  product_name:          string
  sku:                   string
  received_quantity:     number
  unit_merchandise_cost: number
  merchandise_total:     number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCostAllocations(importId: string): Promise<CostAllocation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('import_cost_allocations')
    .select('*')
    .eq('import_id', importId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al obtener distribuciones: ${error.message}`)
  return (data ?? []) as CostAllocation[]
}

export async function getCostAllocationById(allocationId: string): Promise<CostAllocation | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('import_cost_allocations')
    .select('*')
    .eq('id', allocationId)
    .single()

  if (error || !data) return null

  const { data: items } = await supabase
    .from('import_cost_allocation_items')
    .select('*, products(id, name, sku)')
    .eq('allocation_id', allocationId)
    .order('created_at', { ascending: true })

  return {
    ...(data as CostAllocation),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (items as any[] ?? []) as CostAllocationItem[],
  }
}

export async function getProductsForAllocation(importId: string): Promise<ProductForAllocation[]> {
  const supabase = await createClient()

  // Get confirmed receipts for this import
  const { data: receipts } = await supabase
    .from('import_receipts')
    .select('id')
    .eq('import_id', importId)
    .eq('status', 'confirmed')

  if (!receipts || receipts.length === 0) return []

  const receiptIds = receipts.map((r) => r.id)

  // Get accepted quantities per product from confirmed receipt items
  const { data: receiptItems } = await supabase
    .from('import_receipt_items')
    .select('product_id, received_quantity, damaged_quantity, products(id, name, sku)')
    .in('receipt_id', receiptIds)
    .gt('received_quantity', 0)

  if (!receiptItems || receiptItems.length === 0) return []

  // Aggregate received per product (accepted = received - damaged)
  const receivedMap = new Map<string, { name: string; sku: string; qty: number }>()
  for (const item of (receiptItems as unknown) as Array<{
    product_id: string; received_quantity: number; damaged_quantity: number
    products: { name: string; sku: string } | null
  }>) {
    const accepted = (item.received_quantity ?? 0) - (item.damaged_quantity ?? 0)
    if (accepted <= 0) continue
    const existing = receivedMap.get(item.product_id)
    if (existing) {
      existing.qty += accepted
    } else {
      receivedMap.set(item.product_id, {
        name: item.products?.name ?? '—',
        sku:  item.products?.sku  ?? '—',
        qty:  accepted,
      })
    }
  }

  if (receivedMap.size === 0) return []

  // Get linked purchase orders
  const { data: linked } = await supabase
    .from('import_purchase_orders')
    .select('purchase_order_id')
    .eq('import_id', importId)

  const poIds = (linked ?? []).map((r) => r.purchase_order_id)

  // Get unit costs from PO items for these products
  const productIds = [...receivedMap.keys()]
  const unitCostMap = new Map<string, { totalCost: number; totalQty: number }>()

  if (poIds.length > 0) {
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('product_id, quantity, unit_cost')
      .in('purchase_order_id', poIds)
      .in('product_id', productIds)

    for (const item of poItems ?? []) {
      const existing = unitCostMap.get(item.product_id)
      if (existing) {
        existing.totalCost += item.unit_cost * item.quantity
        existing.totalQty  += item.quantity
      } else {
        unitCostMap.set(item.product_id, {
          totalCost: item.unit_cost * item.quantity,
          totalQty:  item.quantity,
        })
      }
    }
  }

  const result: ProductForAllocation[] = []
  for (const [productId, { name, sku, qty }] of receivedMap) {
    const costData = unitCostMap.get(productId)
    const avgUnitCost = costData && costData.totalQty > 0
      ? costData.totalCost / costData.totalQty
      : 0

    result.push({
      product_id:            productId,
      product_name:          name,
      sku,
      received_quantity:     qty,
      unit_merchandise_cost: avgUnitCost,
      merchandise_total:     avgUnitCost * qty,
    })
  }

  return result
}

export async function getLatestAllocation(importId: string): Promise<CostAllocation | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('import_cost_allocations')
    .select('id')
    .eq('import_id', importId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return getCostAllocationById(data.id)
}
