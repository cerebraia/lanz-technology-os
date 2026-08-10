'use client'

import { useActionState, useState } from 'react'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { Alert }    from '@/components/ui/alert'
import { Card, CardBody } from '@/components/ui/card'
import type { ProductWithStock } from '@/features/sales/data/products'
import { createManualSaleAction, type ManualSaleState } from '@/features/sales/actions/manual-sale-action'
import { MANUAL_SALE_CHANNEL_OPTIONS, MANUAL_SALE_PAYMENT_OPTIONS, CURRENCY_OPTIONS } from '@/features/orders/data/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleItem = {
  product_id:      string
  product_name:    string
  product_sku:     string
  quantity:        number
  unit_price:      number
  discount_amount: number
  available:       number
  currency:        string
}

type Props = {
  products: ProductWithStock[]
}

// ─── Item row in the product table ───────────────────────────────────────────

function ItemRow({
  item,
  index,
  onRemove,
  onQtyChange,
  onPriceChange,
}: {
  item:         SaleItem
  index:        number
  onRemove:     (i: number) => void
  onQtyChange:  (i: number, qty: number) => void
  onPriceChange:(i: number, price: number) => void
}) {
  const lineTotal = item.quantity * item.unit_price - item.discount_amount
  const stockWarn = item.quantity > item.available

  return (
    <tr className="border-b border-lz-border/50 last:border-0">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-lz-text">{item.product_name}</p>
        <p className="font-mono text-xs text-lz-muted">{item.product_sku}</p>
        {stockWarn && (
          <p className="text-xs text-lz-danger">
            Máximo disponible: {item.available}
          </p>
        )}
      </td>
      <td className="px-3 py-3 w-24">
        <input
          type="number"
          min={1}
          max={item.available}
          value={item.quantity}
          onChange={(e) => onQtyChange(index, parseInt(e.target.value) || 1)}
          className="w-full rounded-lg border border-lz-border bg-lz-surface px-2 py-1.5 text-sm text-right text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
        />
      </td>
      <td className="px-3 py-3 w-28 hidden sm:table-cell">
        <input
          type="number"
          min={0}
          step={0.01}
          value={item.unit_price}
          onChange={(e) => onPriceChange(index, parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-lz-border bg-lz-surface px-2 py-1.5 text-sm text-right text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
        />
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-lz-text w-24">
        {item.currency} {lineTotal.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-right w-16">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs text-lz-muted hover:text-lz-danger transition-colors"
        >
          Quitar
        </button>
      </td>
    </tr>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ManualSaleForm({ products }: Props) {
  const [state, formAction, pending] = useActionState<ManualSaleState, FormData>(
    createManualSaleAction,
    undefined
  )

  const errors = state && 'errors' in state ? state.errors : {}

  const [items,        setItems]        = useState<SaleItem[]>([])
  const [selectedId,   setSelectedId]   = useState('')
  const [discount,     setDiscount]     = useState(0)
  const [shipping,     setShipping]     = useState(0)
  const [currency,     setCurrency]     = useState('USD')

  const productOptions = [
    { value: '', label: 'Seleccionar producto…' },
    ...products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku}) — stock: ${p.available}`,
    })),
  ]

  function addProduct() {
    if (!selectedId) return
    const prod = products.find((p) => p.id === selectedId)
    if (!prod) return
    if (prod.available <= 0) return

    const existing = items.findIndex((i) => i.product_id === selectedId)
    if (existing >= 0) {
      const updated = [...items]
      const newQty  = updated[existing].quantity + 1
      if (newQty <= updated[existing].available) {
        updated[existing] = { ...updated[existing], quantity: newQty }
        setItems(updated)
      }
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_id:      prod.id,
          product_name:    prod.name,
          product_sku:     prod.sku,
          quantity:        1,
          unit_price:      prod.salePrice,
          discount_amount: 0,
          available:       prod.available,
          currency:        prod.currency,
        },
      ])
    }
    setSelectedId('')
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateQty(i: number, qty: number) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, quantity: Math.min(Math.max(qty, 1), item.available) } : item
      )
    )
  }

  function updatePrice(i: number, price: number) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === i ? { ...item, unit_price: Math.max(price, 0) } : item
      )
    )
  }

  const subtotal    = items.reduce((a, i) => a + i.quantity * i.unit_price - i.discount_amount, 0)
  const total       = Math.max(subtotal - discount + shipping, 0)
  const hasStockErr = items.some((i) => i.quantity > i.available)

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden serialized items */}
      <input type="hidden" name="items"    value={JSON.stringify(items)} />
      <input type="hidden" name="currency" value={currency} />

      {errors._ && (
        <Alert variant="danger">{errors._.join('. ')}</Alert>
      )}

      {/* ── Cliente ── */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Datos del cliente
          </p>
          <p className="mb-4 text-xs text-lz-muted">
            Si ya existe un cliente con el mismo teléfono, se reutilizará su registro.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              name="first_name"
              required
              placeholder="Nombre"
              error={errors.first_name?.[0]}
            />
            <Input
              label="Apellido"
              name="last_name"
              placeholder="Apellido"
            />
            <Input
              label="Teléfono"
              name="phone"
              type="tel"
              placeholder="+58 412 000 0000"
            />
            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              placeholder="cliente@email.com"
            />
          </div>
          <div className="mt-4">
            <Input
              label="Dirección"
              name="address"
              placeholder="Dirección de entrega (opcional)"
            />
          </div>
        </CardBody>
      </Card>

      {/* ── Canal y moneda ── */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Canal de venta
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Canal"
              name="sale_channel"
              required
              placeholder="Seleccionar canal…"
              options={MANUAL_SALE_CHANNEL_OPTIONS}
              error={errors.sale_channel?.[0]}
            />
            <Select
              label="Moneda"
              name="currency_display"
              options={CURRENCY_OPTIONS}
              defaultValue={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* ── Productos ── */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Productos
          </p>
          {errors.items && (
            <Alert variant="danger" className="mb-4">{errors.items.join('. ')}</Alert>
          )}

          {/* Product picker */}
          <div className="flex gap-2">
            <div className="flex-1">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="block w-full rounded-lg border border-lz-border bg-lz-surface px-3 py-2 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
              >
                {productOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addProduct}>
              Agregar
            </Button>
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-sidebar">
                  <tr>
                    {['Producto', 'Cant.', 'Precio unit.', 'Total', ''].map((h, i) => (
                      <th
                        key={i}
                        className={[
                          'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted',
                          i === 0 ? 'text-left' : 'text-right',
                          i === 2 ? 'hidden sm:table-cell' : '',
                        ].join(' ')}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <ItemRow
                      key={item.product_id + i}
                      item={item}
                      index={i}
                      onRemove={removeItem}
                      onQtyChange={updateQty}
                      onPriceChange={updatePrice}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length === 0 && (
            <p className="mt-4 text-sm text-lz-muted">Sin productos. Selecciona uno arriba.</p>
          )}
        </CardBody>
      </Card>

      {/* ── Resumen ── */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Resumen y ajustes
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Descuento global (USD)"
              name="discount_amount"
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <Input
              label="Costo de envío (USD)"
              name="shipping_amount"
              type="number"
              min={0}
              step={0.01}
              value={shipping}
              onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="mt-4 space-y-1.5 rounded-lg border border-lz-border bg-lz-surface p-4">
            <div className="flex justify-between text-sm text-lz-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{currency} {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-lz-muted">
                <span>Descuento</span>
                <span className="tabular-nums text-lz-danger">− {currency} {discount.toFixed(2)}</span>
              </div>
            )}
            {shipping > 0 && (
              <div className="flex justify-between text-sm text-lz-muted">
                <span>Envío</span>
                <span className="tabular-nums">+ {currency} {shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-lz-border pt-2 text-base font-bold text-lz-text">
              <span>Total</span>
              <span className="tabular-nums">{currency} {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <Textarea
              label="Observaciones"
              name="notes"
              rows={2}
              placeholder="Instrucciones, referencias, comentarios internos…"
            />
          </div>
        </CardBody>
      </Card>

      {/* ── Pago ── */}
      <Card padding={false}>
        <CardBody>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
            Método de pago
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Método"
              name="payment_method"
              required
              placeholder="Seleccionar método…"
              options={MANUAL_SALE_PAYMENT_OPTIONS}
              error={errors.payment_method?.[0]}
            />
            <Input
              label="Referencia / comprobante"
              name="payment_reference"
              placeholder="Nro. de referencia (opcional)"
            />
          </div>
        </CardBody>
      </Card>

      {/* ── Acciones ── */}
      {hasStockErr && (
        <Alert variant="danger">
          Hay productos con cantidad mayor al stock disponible. Corrige las cantidades antes de guardar.
        </Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          loading={pending}
          disabled={items.length === 0 || hasStockErr}
        >
          Registrar venta
        </Button>
      </div>
    </form>
  )
}
