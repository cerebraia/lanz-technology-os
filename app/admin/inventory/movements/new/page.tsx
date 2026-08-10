import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import {
  createInventoryEntry,
  createInventoryExit,
  createInventoryAdjustment,
  createInventoryReservation,
  releaseInventoryReservation,
} from '@/features/inventory/actions/inventory-actions'
import { MovementForm } from '@/features/inventory/components/movement-form'
import { PageHeader } from '@/components/ui/page-header'
import { Alert } from '@/components/ui/alert'

export const metadata: Metadata = { title: 'Registrar movimiento' }

const MOVEMENT_CONFIG = {
  entry:       { label: 'Entrada',           permission: 'inventory.receive' },
  exit:        { label: 'Salida',            permission: 'inventory.adjust'  },
  adjustment:  { label: 'Ajuste',            permission: 'inventory.adjust'  },
  reservation: { label: 'Reserva',           permission: 'inventory.reserve' },
  release:     { label: 'Liberar reserva',   permission: 'inventory.reserve' },
} as const

type MovementType = keyof typeof MOVEMENT_CONFIG

type Props = {
  searchParams: Promise<{ type?: string; product?: string }>
}

async function getActiveProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('status', 'active')
    .is('archived_at', null)
    .order('name')
  return data ?? []
}

export default async function NewMovementPage({ searchParams }: Props) {
  await verifySession()
  const can = await checkPermission('inventory.read')
  if (!can) redirect('/admin')

  const sp   = await searchParams
  const type = (sp.type ?? 'entry') as MovementType

  if (!MOVEMENT_CONFIG[type]) redirect('/admin/inventory/movements/new?type=entry')

  const config    = MOVEMENT_CONFIG[type]
  const canCreate = await checkPermission(config.permission)

  const products = await getActiveProducts()
  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} — ${p.sku}`,
  }))

  const actions = {
    entry:       createInventoryEntry,
    exit:        createInventoryExit,
    adjustment:  createInventoryAdjustment,
    reservation: createInventoryReservation,
    release:     releaseInventoryReservation,
  }

  const TYPE_TABS: { key: MovementType; label: string }[] = [
    { key: 'entry',       label: 'Entrada' },
    { key: 'exit',        label: 'Salida'  },
    { key: 'adjustment',  label: 'Ajuste'  },
    { key: 'reservation', label: 'Reserva' },
    { key: 'release',     label: 'Liberar reserva' },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Registrar movimiento"
        description="Todos los cambios de inventario quedan registrados de forma permanente."
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Inventario',    href: '/admin/inventory' },
          { label: 'Movimientos',   href: '/admin/inventory/movements' },
          { label: 'Nuevo' },
        ]}
      />

      {/* Selector de tipo */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map(({ key, label }) => (
          <a
            key={key}
            href={`/admin/inventory/movements/new?type=${key}`}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              key === type
                ? 'border-lz-primary/50 bg-lz-primary/15 text-lz-accent'
                : 'border-lz-border bg-lz-bg text-lz-muted hover:border-lz-border hover:text-lz-text',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </div>

      {!canCreate ? (
        <Alert variant="danger">
          No tienes permiso para registrar movimientos de tipo &quot;{config.label}&quot;.
        </Alert>
      ) : products.length === 0 ? (
        <Alert variant="warning">
          No hay productos activos en el catálogo. Crea y activa al menos un producto antes de registrar movimientos.
        </Alert>
      ) : (
        <div className="max-w-xl">
          <MovementForm
            action={actions[type]}
            products={productOptions}
            defaultProductId={sp.product}
            type={type}
          />
        </div>
      )}
    </div>
  )
}
