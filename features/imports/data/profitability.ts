import { createClient } from '@/lib/supabase/server'
import { getLatestAllocation, type CostAllocationItem } from './costs'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfitabilitySnapshot = {
  id:                     string
  import_id:              string
  total_merchandise_cost: number
  total_logistics_cost:   number
  total_cost:             number
  total_revenue:          number
  gross_profit:           number
  margin:                 number
  roi:                    number
  currency:               string
  notes:                  string | null
  created_by:             string | null
  created_at:             string
}

export type ProductProfitLine = {
  product_id:            string
  product_name:          string
  sku:                   string
  received_quantity:     number
  unit_merchandise_cost: number
  allocated_logistics:   number
  final_unit_cost:       number
  sale_price:            number
  revenue:               number
  cost:                  number
  gross_profit:          number
  margin:                number
}

export type ProfitabilityAnalysis = {
  total_merchandise_cost: number
  total_logistics_cost:   number
  total_cost:             number
  total_revenue:          number
  gross_profit:           number
  margin:                 number
  roi:                    number
  has_allocation:         boolean
  products:               ProductProfitLine[]
  snapshots:              ProfitabilitySnapshot[]
}

// ─── Compute ──────────────────────────────────────────────────────────────────

export async function computeProfitability(importId: string): Promise<ProfitabilityAnalysis> {
  const supabase = await createClient()

  // 1. Total logistics costs
  const { data: expenses } = await supabase
    .from('import_expenses')
    .select('amount')
    .eq('import_id', importId)

  const total_logistics_cost = (expenses ?? []).reduce((acc, e) => acc + e.amount, 0)

  // 2. Get confirmed receipts
  const { data: receipts } = await supabase
    .from('import_receipts')
    .select('id')
    .eq('import_id', importId)
    .eq('status', 'confirmed')

  const receiptIds = (receipts ?? []).map((r) => r.id)

  // 3. Get accepted quantities and product info
  const productMap = new Map<string, {
    name: string; sku: string; qty: number
    unit_merchandise_cost: number; sale_price: number
  }>()

  if (receiptIds.length > 0) {
    const { data: receiptItems } = await supabase
      .from('import_receipt_items')
      .select('product_id, received_quantity, damaged_quantity, products(id, name, sku, sale_price)')
      .in('receipt_id', receiptIds)
      .gt('received_quantity', 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (receiptItems as any[] ?? [])) {
      const accepted = (item.received_quantity ?? 0) - (item.damaged_quantity ?? 0)
      if (accepted <= 0) continue
      const existing = productMap.get(item.product_id)
      if (existing) {
        existing.qty += accepted
      } else {
        productMap.set(item.product_id, {
          name:                  item.products?.name       ?? '—',
          sku:                   item.products?.sku        ?? '—',
          sale_price:            item.products?.sale_price ?? 0,
          qty:                   accepted,
          unit_merchandise_cost: 0,
        })
      }
    }
  }

  // 4. Get merchandise unit costs from PO items
  const { data: linked } = await supabase
    .from('import_purchase_orders')
    .select('purchase_order_id')
    .eq('import_id', importId)

  const poIds = (linked ?? []).map((r) => r.purchase_order_id)
  const productIds = [...productMap.keys()]

  if (poIds.length > 0 && productIds.length > 0) {
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('product_id, quantity, unit_cost')
      .in('purchase_order_id', poIds)
      .in('product_id', productIds)

    const costAccumulator = new Map<string, { totalCost: number; totalQty: number }>()
    for (const item of poItems ?? []) {
      const existing = costAccumulator.get(item.product_id)
      if (existing) {
        existing.totalCost += item.unit_cost * item.quantity
        existing.totalQty  += item.quantity
      } else {
        costAccumulator.set(item.product_id, {
          totalCost: item.unit_cost * item.quantity,
          totalQty:  item.quantity,
        })
      }
    }

    for (const [pid, data] of productMap) {
      const costData = costAccumulator.get(pid)
      if (costData && costData.totalQty > 0) {
        data.unit_merchandise_cost = costData.totalCost / costData.totalQty
      }
    }
  }

  // 5. Get latest allocation for logistics distribution per product
  const allocation    = await getLatestAllocation(importId)
  const has_allocation = !!allocation?.items?.length

  const allocationMap = new Map<string, CostAllocationItem>()
  if (allocation?.items) {
    for (const item of allocation.items) {
      allocationMap.set(item.product_id, item)
    }
  }

  // 6. Build per-product profitability lines
  let total_merchandise_cost = 0
  let total_revenue          = 0
  const products: ProductProfitLine[] = []

  for (const [product_id, data] of productMap) {
    const allocItem      = allocationMap.get(product_id)
    const allocated_log  = allocItem?.allocated_amount ?? 0
    const final_unit     = has_allocation
      ? (allocItem?.final_unit_cost ?? data.unit_merchandise_cost)
      : data.unit_merchandise_cost

    const merch_cost   = data.unit_merchandise_cost * data.qty
    const revenue      = data.sale_price * data.qty
    const total_prd_cost = has_allocation ? final_unit * data.qty : merch_cost
    const profit       = revenue - total_prd_cost
    const margin_prd   = revenue > 0 ? (profit / revenue) * 100 : 0

    total_merchandise_cost += merch_cost
    total_revenue          += revenue

    products.push({
      product_id,
      product_name:          data.name,
      sku:                   data.sku,
      received_quantity:     data.qty,
      unit_merchandise_cost: data.unit_merchandise_cost,
      allocated_logistics:   allocated_log,
      final_unit_cost:       final_unit,
      sale_price:            data.sale_price,
      revenue,
      cost:                  total_prd_cost,
      gross_profit:          profit,
      margin:                margin_prd,
    })
  }

  const total_cost   = has_allocation
    ? total_merchandise_cost + total_logistics_cost
    : total_merchandise_cost
  const gross_profit = total_revenue - (has_allocation ? total_cost : total_merchandise_cost)
  const revenue_base = has_allocation ? total_cost : total_merchandise_cost
  const margin       = total_revenue > 0  ? (gross_profit / total_revenue) * 100  : 0
  const roi          = revenue_base  > 0  ? (gross_profit / revenue_base)  * 100  : 0

  // 7. Get saved snapshots
  const { data: snapshots } = await supabase
    .from('import_profitability')
    .select('*')
    .eq('import_id', importId)
    .order('created_at', { ascending: false })

  return {
    total_merchandise_cost,
    total_logistics_cost,
    total_cost:   has_allocation ? total_cost : total_merchandise_cost,
    total_revenue,
    gross_profit,
    margin,
    roi,
    has_allocation,
    products,
    snapshots: (snapshots ?? []) as ProfitabilitySnapshot[],
  }
}

export async function getLatestSnapshot(importId: string): Promise<ProfitabilitySnapshot | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('import_profitability')
    .select('*')
    .eq('import_id', importId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return (data ?? null) as ProfitabilitySnapshot | null
}
