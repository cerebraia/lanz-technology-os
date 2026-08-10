// Tipos puros y funciones sin dependencias de servidor.
// Importable desde Client Components.

export type StockStatus = 'out' | 'low' | 'ok'

export type InventoryEntry = {
  id:          string
  product_id:  string
  location_id: string
  on_hand:     number
  reserved:    number
  available:   number
  products: {
    name:       string
    sku:        string
    min_stock:  number
    categories: { name: string } | null
  }
}

export function getStockStatus(available: number, minStock: number): StockStatus {
  if (available <= 0)          return 'out'
  if (available <= minStock)   return 'low'
  return 'ok'
}
