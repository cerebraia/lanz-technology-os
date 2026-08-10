import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession, checkPermission } from '@/lib/dal'
import { redirect } from 'next/navigation'
import {
  getInventoryList,
  getInventoryStats,
  type StockStatus,
} from '@/features/inventory/data/inventory'
import { getCategories } from '@/features/catalog/data/categories'
import { InventoryFilters } from '@/features/inventory/components/inventory-filters'
import { InventoryTable }   from '@/features/inventory/components/inventory-table'
import { PageHeader } from '@/components/ui/page-header'
import { Card }       from '@/components/ui/card'
import { Skeleton }   from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Inventario' }

// ─── Summary stats ────────────────────────────────────────────────────────────

async function StatsPanel() {
  const stats = await getInventoryStats()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Total de productos', value: stats.total,      color: 'text-lz-text'    },
        { label: 'En stock',           value: stats.ok,         color: 'text-lz-success' },
        { label: 'Stock bajo',         value: stats.lowStock,   color: 'text-lz-warning' },
        { label: 'Sin stock',          value: stats.outOfStock, color: 'text-lz-danger'  },
      ].map(({ label, value, color }) => (
        <Card key={label} className="text-center">
          <p className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
          <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{ search?: string; category?: string; stock?: string }>
}

export default async function InventoryPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('inventory.read')
  if (!canRead) redirect('/admin')
  const canAdjust = await checkPermission('inventory.adjust')

  const sp         = await searchParams
  const categories = await getCategories()
  const entries    = await getInventoryList({
    search:     sp.search    || undefined,
    categoryId: sp.category  || undefined,
    stock:      (sp.stock as StockStatus | '') || undefined,
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Inventario"
        description="Stock actual por producto. Usa el botón «Ajustar stock» para correcciones rápidas."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Inventario' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/inventory/entries/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              + Registrar entrada
            </Link>
            <Link
              href="/admin/inventory/adjustments/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lz-border bg-lz-surface px-3 text-xs font-medium text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
            >
              Ajuste formal
            </Link>
          </div>
        }
      />

      {/* Ayuda visual */}
      <div className="rounded-lg border border-lz-border/50 bg-lz-surface/60 px-4 py-3 text-xs text-lz-muted">
        El inventario se actualiza únicamente mediante movimientos auditados.{' '}
        <strong className="text-lz-text">Ajustar stock</strong> calcula la diferencia y genera el movimiento automáticamente.
        Cada cambio queda registrado con usuario, fecha y motivo.
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="space-y-2">
                <Skeleton className="mx-auto h-7 w-12" />
                <Skeleton className="mx-auto h-3 w-24" />
              </Card>
            ))}
          </div>
        }
      >
        <StatsPanel />
      </Suspense>

      {/* Filtros */}
      <Suspense fallback={<Skeleton className="h-9 w-full max-w-sm" />}>
        <InventoryFilters categories={categories} />
      </Suspense>

      {/* Tabla con acciones interactivas */}
      <InventoryTable entries={entries} canAdjust={canAdjust} />
    </div>
  )
}
