'use client'

import Link from 'next/link'
import { Badge }      from '@/components/ui/badge'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { IconBox }    from '@/components/icons'
import { QuickAdjustButton } from '@/features/inventory/components/quick-adjust-button'
import { getStockStatus, type InventoryEntry, type StockStatus } from '@/features/inventory/data/types'

function StockBadge({ status }: { status: StockStatus }) {
  if (status === 'out') return <Badge variant="danger">Sin stock</Badge>
  if (status === 'low') return <Badge variant="warning">Stock bajo</Badge>
  return <Badge variant="success">En stock</Badge>
}

type Props = {
  entries:   InventoryEntry[]
  canAdjust: boolean
}

export function InventoryTable({ entries, canAdjust }: Props) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<IconBox size={22} className="text-lz-muted" />}
        title="Sin registros de inventario"
        description="Los productos aparecerán aquí una vez que reciban su primer movimiento de stock."
      />
    )
  }

  const COLUMNS = [
    {
      key: 'product',
      header: 'Producto',
      render: (row: InventoryEntry) => (
        <div>
          <Link
            href={`/admin/inventory/${row.product_id}`}
            className="font-medium text-lz-text transition-colors hover:text-lz-accent"
          >
            {row.products.name}
          </Link>
          <p className="mt-0.5 font-mono text-xs text-lz-muted">{row.products.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      className: 'hidden md:table-cell',
      render: (row: InventoryEntry) => (
        <span className="text-xs text-lz-muted">
          {row.products.categories?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Disponible',
      render: (row: InventoryEntry) => (
        <span className="tabular-nums text-sm font-medium text-lz-text">
          {row.available}
        </span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reservado',
      className: 'hidden sm:table-cell',
      render: (row: InventoryEntry) => (
        <span className="tabular-nums text-xs text-lz-muted">{row.reserved}</span>
      ),
    },
    {
      key: 'on_hand',
      header: 'Total físico',
      className: 'hidden lg:table-cell',
      render: (row: InventoryEntry) => (
        <span className="tabular-nums text-xs text-lz-muted">{row.on_hand}</span>
      ),
    },
    {
      key: 'min_stock',
      header: 'Mínimo',
      className: 'hidden lg:table-cell',
      render: (row: InventoryEntry) => (
        <span className="tabular-nums text-xs text-lz-muted">{row.products.min_stock}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: InventoryEntry) => (
        <StockBadge status={getStockStatus(row.available, row.products.min_stock)} />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: InventoryEntry) => (
        <div className="flex items-center justify-end gap-3">
          {canAdjust && (
            <QuickAdjustButton
              productId={row.product_id}
              productName={row.products.name}
              currentOnHand={row.on_hand}
            />
          )}
          <Link
            href={`/admin/inventory/entries/new?product=${row.product_id}`}
            className="text-xs text-lz-muted transition-colors hover:text-lz-success"
            title="Registrar entrada de stock"
          >
            Entrada
          </Link>
          <Link
            href={`/admin/inventory/${row.product_id}`}
            className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
          >
            Detalle
          </Link>
        </div>
      ),
    },
  ]

  return <Table columns={COLUMNS} rows={entries} keyExtractor={(row) => row.id} />
}
