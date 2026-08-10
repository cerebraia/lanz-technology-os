'use server'

/**
 * Server Action de validación del carrito público.
 *
 * Usa el cliente anon con RLS migration 009.
 * Solo devuelve datos públicos: precio efectivo, existencia, publicación.
 * NO devuelve: costos, márgenes, inventario exacto ni datos internos.
 *
 * Limitación P3: La disponibilidad exacta de inventario no es accesible para anon.
 * La cantidad máxima retorna null hasta que se implemente una política RLS en
 * inventory_balances (pendiente P4).
 */

import { createClient } from '@/lib/supabase/server'

export type CartValidationInput = {
  productId: string
  cartPrice: number
  quantity:  number
}[]

export type ProductValidationResult = {
  productId:     string
  found:         boolean   // false si RLS filtró el producto (no publicado, archivado, etc.)
  name:          string
  currentPrice:  number    // precio efectivo actual (promo o normal)
  priceChanged:  boolean
  oldPrice:      number    // precio en el carrito
  newPrice:      number    // precio actual en servidor
  currency:      string
  maxQuantity:   number | null   // null = no disponible públicamente (P4)
}

export type CartValidationResult = {
  results:    ProductValidationResult[]
  rlsWorking: boolean   // al menos un producto fue encontrado — prueba que RLS 009 está activa
  error:      string | null
}

export async function validateCartItems(
  input: CartValidationInput
): Promise<CartValidationResult> {
  if (input.length === 0) {
    return { results: [], rlsWorking: true, error: null }
  }

  try {
    const supabase    = await createClient()
    const productIds  = input.map(i => i.productId)

    const { data, error } = await supabase
      .from('products')
      .select('id, name, sale_price, promotional_price, currency_code')
      .in('id', productIds)
      // RLS migration 009 garantiza que solo retorna productos publicados, activos, no archivados

    if (error) {
      return { results: [], rlsWorking: false, error: error.message }
    }

    const found = data ?? []
    const foundMap = new Map(
      found.map(p => [
        p.id,
        {
          name:             p.name,
          currentEffective: p.promotional_price !== null && p.promotional_price < p.sale_price
            ? p.promotional_price
            : p.sale_price,
          currency:         p.currency_code,
        },
      ])
    )

    const results: ProductValidationResult[] = input.map(item => {
      const server = foundMap.get(item.productId)
      if (!server) {
        return {
          productId:    item.productId,
          found:        false,
          name:         '',
          currentPrice: item.cartPrice,
          priceChanged: false,
          oldPrice:     item.cartPrice,
          newPrice:     item.cartPrice,
          currency:     '',
          maxQuantity:  null,
        }
      }

      const priceChanged = Math.abs(server.currentEffective - item.cartPrice) > 0.001

      return {
        productId:    item.productId,
        found:        true,
        name:         server.name,
        currentPrice: server.currentEffective,
        priceChanged,
        oldPrice:     item.cartPrice,
        newPrice:     server.currentEffective,
        currency:     server.currency,
        maxQuantity:  null,   // P4: implementar con función SECURITY DEFINER en inventory_balances
      }
    })

    // Si 0 productos encontrados siendo todos los IDs válidos → RLS probablemente no está activa
    const rlsWorking = found.length > 0 || input.length === 0

    return { results, rlsWorking, error: null }
  } catch (e) {
    return { results: [], rlsWorking: false, error: (e as Error).message }
  }
}
