'use client'

import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { slugify } from '@/lib/utils/slugify'
import type { ProductWithCategory } from '@/features/catalog/data/products'
import type { Category } from '@/features/catalog/data/categories'
import type { ProductActionState } from '@/features/catalog/actions/product-actions'

type ProductFormProps = {
  action: (prev: ProductActionState, fd: FormData) => Promise<ProductActionState>
  initialData?: ProductWithCategory
  categories: Category[]
  submitLabel?: string
}

const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Borrador — no visible en la tienda' },
  { value: 'active',   label: 'Activo — listo para publicar' },
  { value: 'archived', label: 'Archivado — retirado del catálogo' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'VES', label: 'VES — Bolívar' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-lz-muted">
      {children}
    </p>
  )
}

export function ProductForm({
  action,
  initialData,
  categories,
  submitLabel = 'Guardar',
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [slug, setSlug]              = useState(initialData?.slug ?? '')
  const [autoSlug, setAutoSlug]      = useState(!initialData)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (autoSlug) setSlug(slugify(e.target.value))
  }

  const errors          = state && 'errors' in state ? state.errors : {}
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const promoDefault =
    initialData?.promotional_price != null
      ? String(initialData.promotional_price)
      : ''

  return (
    <form action={formAction} className="space-y-6">
      {errors._ && <Alert variant="danger">{errors._.join('. ')}</Alert>}
      {state && 'success' in state && <Alert variant="success">{state.message}</Alert>}

      {/* Información general */}
      <Card>
        <SectionTitle>Información general</SectionTitle>
        <div className="space-y-4">
          <Input
            label="Nombre del producto"
            name="name"
            required
            defaultValue={initialData?.name}
            onChange={handleNameChange}
            placeholder="DJI Mini 4 Pro"
            error={errors.name?.[0]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Slug (URL)"
              name="slug"
              required
              value={slug}
              onChange={(e) => { setAutoSlug(false); setSlug(e.target.value) }}
              hint="Solo letras minúsculas, números y guiones."
              error={errors.slug?.[0]}
            />
            <Input
              label="SKU"
              name="sku"
              required
              defaultValue={initialData?.sku}
              placeholder="DJI-MINI4PRO"
              hint="Se convertirá a mayúsculas."
              error={errors.sku?.[0]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Marca"
              name="brand"
              defaultValue={initialData?.brand ?? ''}
              placeholder="DJI"
            />
            <Input
              label="Modelo"
              name="model"
              defaultValue={initialData?.model ?? ''}
              placeholder="Mini 4 Pro"
            />
          </div>
        </div>
      </Card>

      {/* Organización */}
      <Card>
        <SectionTitle>Organización</SectionTitle>
        <Select
          label="Categoría"
          name="category_id"
          placeholder="Sin categoría"
          options={categoryOptions}
          defaultValue={initialData?.category_id ?? ''}
        />
      </Card>

      {/* Precio */}
      <Card>
        <SectionTitle>Precio</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Precio de venta (USD)"
              name="sale_price"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={initialData?.sale_price ?? ''}
              placeholder="0.00"
              hint="Precio base. Debe ser mayor a cero para publicar."
              error={errors.sale_price?.[0]}
            />
            <Select
              label="Moneda"
              name="currency_code"
              options={CURRENCY_OPTIONS}
              defaultValue={initialData?.currency_code ?? 'USD'}
            />
          </div>
          <Input
            label="Precio promocional"
            name="promotional_price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={promoDefault}
            placeholder="Dejar vacío si no aplica"
            hint="Opcional. Debe ser menor al precio de venta."
            error={errors.promotional_price?.[0]}
          />
        </div>
      </Card>

      {/* Precios Venezuela */}
      <Card>
        <SectionTitle>Precio en divisas (Venezuela)</SectionTitle>
        <div className="space-y-4">
          <Input
            label="Precio efectivo / Zelle / USDT (USD)"
            name="cash_price_usd"
            type="number"
            min={0}
            step="0.01"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            defaultValue={(initialData as any)?.cash_price_usd ?? ''}
            placeholder="160.00"
            hint="Aplica para pagos en efectivo, Zelle o USDT."
            error={errors.cash_price_usd?.[0]}
          />
          <Input
            label="Precio base BCV (USD)"
            name="bcv_reference_price_usd"
            type="number"
            min={0}
            step="0.01"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            defaultValue={(initialData as any)?.bcv_reference_price_usd ?? ''}
            placeholder="190.00"
            hint="El precio en bolívares se calcula multiplicando este valor por la tasa BCV vigente."
            error={errors.bcv_reference_price_usd?.[0]}
          />
          <p className="text-xs text-lz-muted">
            Ejemplo: si el precio BCV es 190 y la tasa BCV es 40 Bs/USD, el precio en bolívares será 7 600 Bs.
          </p>
        </div>
      </Card>

      {/* Descripción */}
      <Card>
        <SectionTitle>Descripción</SectionTitle>
        <div className="space-y-4">
          <Input
            label="Descripción corta"
            name="short_description"
            defaultValue={initialData?.short_description ?? ''}
            placeholder="Resumen breve para listados y tarjetas."
          />
          <Textarea
            label="Descripción completa"
            name="description"
            rows={6}
            defaultValue={initialData?.description ?? ''}
            placeholder="Descripción detallada del producto."
          />
        </div>
      </Card>

      {/* Publicación */}
      <Card>
        <SectionTitle>Publicación</SectionTitle>
        <div className="space-y-4">
          <Select
            label="Estado"
            name="status"
            options={STATUS_OPTIONS}
            defaultValue={initialData?.status ?? 'draft'}
          />
          <Switch
            name="is_featured"
            label="Producto destacado"
            hint="Aparece en secciones especiales de la tienda."
            defaultChecked={initialData?.is_featured ?? false}
          />
          {initialData?.published_at && (
            <p className="text-xs text-lz-muted">
              Publicado el{' '}
              {new Date(initialData.published_at).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
          <Alert variant="info">
            Para publicar en la tienda usa el botón &quot;Publicar&quot; en la cabecera.
            El estado &quot;Activo&quot; prepara el producto pero no lo hace visible hasta publicarlo.
          </Alert>
        </div>
      </Card>

      {/* Inventario mínimo */}
      <Card>
        <SectionTitle>Inventario</SectionTitle>
        <Input
          label="Stock mínimo"
          name="min_stock"
          type="number"
          min={0}
          defaultValue={initialData?.min_stock ?? 0}
          hint="Alerta cuando el stock disponible baje de este valor."
        />
      </Card>

      {/* Multimedia adicional */}
      <Card>
        <SectionTitle>Video de YouTube</SectionTitle>
        <Input
          label="URL del video"
          name="youtube_url"
          type="url"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultValue={(initialData as any)?.youtube_url ?? ''}
          placeholder="https://www.youtube.com/watch?v=..."
          hint="Opcional. Solo URLs de youtube.com o youtu.be."
          error={errors.youtube_url?.[0]}
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
