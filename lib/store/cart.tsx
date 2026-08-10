'use client'

/**
 * Estado del carrito — Lanz Technology
 *
 * Reglas de negocio:
 * 1. El carrito es un snapshot visual temporal en localStorage.
 * 2. El precio almacenado es el precio efectivo al momento de agregar.
 * 3. Los precios definitivos se recalculan en el servidor durante el checkout.
 * 4. El carrito NO descuenta stock ni crea reservas.
 * 5. La disponibilidad se valida en la página /cart contra Supabase (anon RLS).
 * 6. No almacenar costos, márgenes ni datos internos.
 */

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'

export const CART_KEY = 'lz_cart'

// ─── Tipo central del carrito ─────────────────────────────────────────────────

export type CartItem = {
  id:                   string   // productId
  slug:                 string
  name:                 string
  sku:                  string
  price:                number   // precio efectivo (promo o normal) en el momento de agregar
  currency:             string
  image:                string | null
  quantity:             number
  addedAt:              string   // ISO datetime
  maxAvailableQuantity: number | null  // null = desconocido; validar en servidor
}

// Tipo para callers de addItem — addedAt se genera automáticamente
export type AddToCartInput = Omit<CartItem, 'quantity' | 'addedAt' | 'maxAvailableQuantity'>

// ─── Reducer ──────────────────────────────────────────────────────────────────

type CartState = { items: CartItem[]; hydrated: boolean }

type CartAction =
  | { type: 'HYDRATE';    items: CartItem[] }
  | { type: 'ADD';        item: AddToCartInput }
  | { type: 'REMOVE';     id: string }
  | { type: 'SET_QTY';    id: string; qty: number }
  | { type: 'SET_PRICE';  id: string; price: number }
  | { type: 'SET_MAX';    id: string; max: number | null }
  | { type: 'CLEAR' }

function clamp(qty: number, max: number | null): number {
  const floored = Math.max(1, Math.floor(qty))
  return max !== null ? Math.min(floored, max) : floored
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, hydrated: true }

    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id
              ? { ...i, quantity: clamp(i.quantity + 1, i.maxAvailableQuantity) }
              : i
          ),
        }
      }
      const newItem: CartItem = {
        ...action.item,
        quantity:             1,
        addedAt:              new Date().toISOString(),
        maxAvailableQuantity: null,
      }
      return { ...state, items: [...state.items, newItem] }
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }

    case 'SET_QTY':
      return {
        ...state,
        items: action.qty <= 0
          ? state.items.filter(i => i.id !== action.id)
          : state.items.map(i =>
              i.id === action.id
                ? { ...i, quantity: clamp(action.qty, i.maxAvailableQuantity) }
                : i
            ),
      }

    case 'SET_PRICE':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, price: action.price } : i
        ),
      }

    case 'SET_MAX':
      return {
        ...state,
        items: state.items.map(i => {
          if (i.id !== action.id) return i
          const qty = action.max !== null ? Math.min(i.quantity, action.max) : i.quantity
          return { ...i, maxAvailableQuantity: action.max, quantity: Math.max(1, qty) }
        }),
      }

    case 'CLEAR':
      return { ...state, items: [] }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type CartContextType = {
  items:    CartItem[]
  hydrated: boolean
  count:    number        // total de unidades
  total:    number        // total efectivo (precios ya con descuento)

  addItem:       (item: AddToCartInput) => void
  removeItem:    (id: string) => void
  setQty:        (id: string, qty: number) => void
  incrementItem: (id: string) => void
  decrementItem: (id: string) => void
  setItemPrice:  (id: string, price: number) => void
  setMaxQty:     (id: string, max: number | null) => void
  clear:         () => void
  isInCart:      (id: string) => boolean
}

const CartContext = createContext<CartContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false })

  // Hidratación desde localStorage — solo en el cliente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        // Retrocompatibilidad: items sin addedAt obtienen uno
        const normalized = parsed.map(i => ({
          ...i,
          addedAt:              i.addedAt              ?? new Date().toISOString(),
          maxAvailableQuantity: i.maxAvailableQuantity ?? null,
        }))
        dispatch({ type: 'HYDRATE', items: normalized })
      } else {
        dispatch({ type: 'HYDRATE', items: [] })
      }
    } catch {
      dispatch({ type: 'HYDRATE', items: [] })
    }
  }, [])

  // Persistencia en localStorage después de cada cambio
  useEffect(() => {
    if (!state.hydrated) return
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.items))
    } catch {}
  }, [state.items, state.hydrated])

  const addItem      = useCallback((item: AddToCartInput) => dispatch({ type: 'ADD', item }), [])
  const removeItem   = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), [])
  const setQty       = useCallback((id: string, qty: number) => dispatch({ type: 'SET_QTY', id, qty }), [])
  const incrementItem = useCallback((id: string) => dispatch({ type: 'SET_QTY', id, qty: (state.items.find(i => i.id === id)?.quantity ?? 0) + 1 }), [state.items])
  const decrementItem = useCallback((id: string) => dispatch({ type: 'SET_QTY', id, qty: (state.items.find(i => i.id === id)?.quantity ?? 2) - 1 }), [state.items])
  const setItemPrice = useCallback((id: string, price: number) => dispatch({ type: 'SET_PRICE', id, price }), [])
  const setMaxQty    = useCallback((id: string, max: number | null) => dispatch({ type: 'SET_MAX', id, max }), [])
  const clear        = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const isInCart     = useCallback((id: string) => state.items.some(i => i.id === id), [state.items])

  const count = state.items.reduce((acc, i) => acc + i.quantity, 0)
  const total = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0)

  return (
    <CartContext
      value={{
        items: state.items, hydrated: state.hydrated, count, total,
        addItem, removeItem, setQty, incrementItem, decrementItem,
        setItemPrice, setMaxQty, clear, isInCart,
      }}
    >
      {children}
    </CartContext>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
