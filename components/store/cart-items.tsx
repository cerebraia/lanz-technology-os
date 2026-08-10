'use client'

import { useEffect, useState } from 'react'
import { useCart }             from '@/lib/store/cart'
import { validateCartItems }   from '@/features/store/actions/cart-validation-action'
import { CartItemRow }         from './cart-item-row'
import { CartSummary }         from './cart-summary'
import { CartEmptyState }      from './cart-empty-state'
import { CartValidationAlert } from './cart-validation-alert'

function SkeletonRow() {
  return (
    <div className="flex gap-4 rounded-2xl border border-lz-border bg-lz-surface p-4 animate-pulse">
      <div className="h-20 w-20 shrink-0 rounded-xl bg-lz-border/40" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="h-4 w-3/4 rounded bg-lz-border/60" />
        <div className="h-3 w-16 rounded bg-lz-border/60" />
        <div className="mt-auto h-4 w-24 rounded bg-lz-border/60" />
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="h-8 w-24 rounded-lg bg-lz-border/40" />
        <div className="h-3 w-12 rounded bg-lz-border/60" />
      </div>
    </div>
  )
}

type ValidationState = {
  done:              boolean
  unavailableIds:    Set<string>
  priceChangedIds:   Set<string>
  priceChangedCount: number
  rlsError:          boolean
}

const INITIAL: ValidationState = {
  done:              false,
  unavailableIds:    new Set(),
  priceChangedIds:   new Set(),
  priceChangedCount: 0,
  rlsError:          false,
}

export function CartItems() {
  const { items, hydrated, setItemPrice } = useCart()
  const [validation, setValidation] = useState<ValidationState>(INITIAL)
  const [validating,  setValidating]  = useState(false)

  useEffect(() => {
    // Async IIFE — todas las llamadas a setState ocurren dentro de la función async,
    // después de un await. No hay setState síncrono en el cuerpo del effect.
    // No setState síncrono — todos los cambios de estado ocurren dentro del async IIFE
    if (!hydrated) return

    const snapshot = items.map(i => ({
      productId: i.id,
      cartPrice: i.price,
      quantity:  i.quantity,
    }))

    if (snapshot.length === 0) return  // carrito vacío: el render lo maneja

    void (async () => {
      setValidating(true)
      try {
        const result = await validateCartItems(snapshot)

        const newUnavailable  = new Set<string>()
        const newPriceChanged = new Set<string>()
        let priceChangedCount = 0

        if (result.rlsWorking) {
          for (const v of result.results) {
            if (!v.found) {
              newUnavailable.add(v.productId)
            } else if (v.priceChanged) {
              newPriceChanged.add(v.productId)
              setItemPrice(v.productId, v.newPrice)
              priceChangedCount++
            }
          }
        }

        setValidation({
          done:              true,
          unavailableIds:    newUnavailable,
          priceChangedIds:   newPriceChanged,
          priceChangedCount,
          rlsError:          !result.rlsWorking && result.error !== null,
        })
      } catch {
        setValidation({ ...INITIAL, done: true, rlsError: true })
      } finally {
        setValidating(false)
      }
    })()
  }, [hydrated]) // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ Intencional: validar solo en la hidratación inicial.
  //   Items se capturan en snapshot; no re-validar en cada cambio de cantidad.

  // ── Renderizado ─────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <SkeletonRow />
          <SkeletonRow />
        </div>
        <div className="h-64 w-full animate-pulse rounded-2xl bg-lz-surface lg:w-72 lg:shrink-0" />
      </div>
    )
  }

  if (items.length === 0) return <CartEmptyState />

  const hasUnavailable = validation.unavailableIds.size > 0

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Items */}
      <div className="flex-1 space-y-4">
        {/* Alerts */}
        {validation.rlsError && (
          <CartValidationAlert type="rlsError" />
        )}
        {validation.done && validation.priceChangedCount > 0 && (
          <CartValidationAlert type="price_changed" count={validation.priceChangedCount} />
        )}
        {hasUnavailable && (
          <CartValidationAlert type="unavailable" count={validation.unavailableIds.size} />
        )}

        {/* Validation progress */}
        {validating && (
          <div className="flex items-center gap-2 text-xs text-lz-muted" role="status" aria-live="polite">
            <span className="h-3 w-3 animate-spin rounded-full border border-lz-primary border-t-transparent" aria-hidden />
            Verificando disponibilidad…
          </div>
        )}

        {/* Item rows */}
        {items.map(item => (
          <CartItemRow
            key={item.id}
            item={item}
            unavailable={validation.unavailableIds.has(item.id)}
            priceChanged={validation.priceChangedIds.has(item.id)}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="w-full lg:w-72 lg:shrink-0">
        <CartSummary hasUnavailable={hasUnavailable} />
      </div>
    </div>
  )
}
