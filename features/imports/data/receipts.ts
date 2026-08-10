import { createClient } from '@/lib/supabase/server'
import { getItemDerived } from './constants'
export { getItemDerived } from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportReceipt = {
  id:           string
  import_id:    string
  reference:    string
  status:       string
  location_id:  string
  notes:        string | null
  received_at:  string | null
  confirmed_by: string | null
  confirmed_at: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  created_by:   string | null
  created_at:   string
  updated_at:   string
}

export type ImportReceiptItem = {
  id:                           string
  receipt_id:                   string
  product_id:                   string
  expected_quantity:            number
  previously_received_quantity: number
  received_quantity:            number
  damaged_quantity:             number
  notes:                        string | null
  created_at:                   string
  products: {
    id:   string
    name: string
    sku:  string
  } | null
}

export type ImportReceiptDetail = ImportReceipt & {
  items:               ImportReceiptItem[]
  inventory_locations: { id: string; name: string; code: string } | null
  total_expected:      number
  total_received:      number
  total_accepted:      number
  total_damaged:       number
  total_missing:       number
  total_excess:        number
}

export type ExpectedProduct = {
  product_id:                   string
  product_name:                 string
  sku:                          string
  expected_quantity:            number
  previously_received_quantity: number
  pending_quantity:             number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getImportReceipts(importId: string): Promise<ImportReceipt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('import_receipts')
    .select('*')
    .eq('import_id', importId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al obtener recepciones: ${error.message}`)
  return (data ?? []) as ImportReceipt[]
}

export async function getImportReceiptById(receiptId: string): Promise<ImportReceiptDetail | null> {
  const supabase = await createClient()

  const { data: receipt, error } = await supabase
    .from('import_receipts')
    .select('*, inventory_locations(id, name, code)')
    .eq('id', receiptId)
    .single()

  if (error || !receipt) return null

  const { data: items } = await supabase
    .from('import_receipt_items')
    .select('*, products(id, name, sku)')
    .eq('receipt_id', receiptId)
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemList = (items as any[] ?? []) as ImportReceiptItem[]

  const totals = itemList.reduce((acc, item) => {
    const { accepted, missing, excess } = getItemDerived(item)
    return {
      expected: acc.expected + item.expected_quantity,
      received: acc.received + item.received_quantity,
      accepted: acc.accepted + accepted,
      damaged:  acc.damaged  + item.damaged_quantity,
      missing:  acc.missing  + missing,
      excess:   acc.excess   + excess,
    }
  }, { expected: 0, received: 0, accepted: 0, damaged: 0, missing: 0, excess: 0 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = receipt as any

  return {
    ...(r as ImportReceipt),
    inventory_locations: r.inventory_locations ?? null,
    items:               itemList,
    total_expected:      totals.expected,
    total_received:      totals.received,
    total_accepted:      totals.accepted,
    total_damaged:       totals.damaged,
    total_missing:       totals.missing,
    total_excess:        totals.excess,
  }
}

export async function getExpectedProductsForReceipt(importId: string): Promise<ExpectedProduct[]> {
  const supabase = await createClient()

  // Linked purchase orders for this import
  const { data: linked } = await supabase
    .from('import_purchase_orders')
    .select('purchase_order_id')
    .eq('import_id', importId)

  if (!linked || linked.length === 0) return []

  const poIds = linked.map((r) => r.purchase_order_id)

  // Sum expected quantities per product from PO items
  const { data: poItems } = await supabase
    .from('purchase_order_items')
    .select('product_id, quantity, products(id, name, sku)')
    .in('purchase_order_id', poIds)

  if (!poItems || poItems.length === 0) return []

  // Aggregate by product
  const expectedMap = new Map<string, { name: string; sku: string; qty: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of poItems as any[]) {
    const pid = item.product_id
    const existing = expectedMap.get(pid)
    if (existing) {
      existing.qty += item.quantity
    } else {
      expectedMap.set(pid, {
        name: item.products?.name ?? '—',
        sku:  item.products?.sku ?? '—',
        qty:  item.quantity,
      })
    }
  }

  // Previously received per product (from confirmed receipts)
  const { data: prevItems } = await supabase
    .from('import_receipt_items')
    .select('product_id, received_quantity, damaged_quantity, receipt_id')
    .in('receipt_id',
      (await supabase
        .from('import_receipts')
        .select('id')
        .eq('import_id', importId)
        .eq('status', 'confirmed')
      ).data?.map((r) => r.id) ?? []
    )

  const prevMap = new Map<string, number>()
  for (const item of prevItems ?? []) {
    const accepted = (item.received_quantity ?? 0) - (item.damaged_quantity ?? 0)
    prevMap.set(item.product_id, (prevMap.get(item.product_id) ?? 0) + accepted)
  }

  // Build result — only products with pending > 0
  const result: ExpectedProduct[] = []
  for (const [productId, { name, sku, qty }] of expectedMap) {
    const prev    = prevMap.get(productId) ?? 0
    const pending = qty - prev
    if (pending > 0) {
      result.push({
        product_id:                   productId,
        product_name:                 name,
        sku,
        expected_quantity:            qty,
        previously_received_quantity: prev,
        pending_quantity:             pending,
      })
    }
  }

  return result
}

export async function getInventoryLocations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_locations')
    .select('id, name, code')
    .eq('is_active', true)
    .order('code')
  return (data ?? []).map((l) => ({ value: l.id, label: `${l.code} — ${l.name}` }))
}

export async function getReceiptMovements(receiptId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('inventory_movements')
    .select('id, product_id, quantity, quantity_before, quantity_after, created_at, products(name, sku), inventory_locations(name, code)')
    .eq('reference_type', 'import_receipt')
    .eq('reference_id', receiptId)
    .order('created_at', { ascending: true })
  return data ?? []
}
