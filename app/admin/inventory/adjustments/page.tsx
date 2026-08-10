import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getAdjustments,
  ADJUSTMENT_STATUS_LABELS,
  type InventoryAdjustment,
} from '@/features/inventory/data/adjustments'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { IconBox, IconPlus } from '@/components/icons'
import { AdjustmentFiltersBar } from '@/features/inventory/components/adjustment-filters'

export const metadata: Metadata = { title: 'Ajustes de inventario' }

const COLUMNS = [
  {
    key: 'reference',
    header: 'Referencia',
    render: (row: InventoryAdjustment) => (
      <div>
        <Link
          href={`/admin/inventory/adjustments/${row.id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.reference}
        </Link>
        <p className="mt-0.5 text-xs text-lz-muted">{row.reason}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Estado',
    render: (row: InventoryAdjustment) => {
      const s = ADJUSTMENT_STATUS_LABELS[row.status] ?? { label: row.status, variant: 'neutral' as const }
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
  {
    key: 'user',
    header: 'Usuario',
    className: 'hidden md:table-cell',
    render: (row: InventoryAdjustment) => (
      <span className="text-xs text-lz-muted">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(row as any).created_by_profile?.full_name ?? '—'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Fecha',
    className: 'hidden sm:table-cell',
    render: (row: InventoryAdjustment) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </span>
    ),
  },
  {
    key: 'actions',
    header: '',
    className: 'text-right',
    render: (row: InventoryAdjustment) => (
      <Link
        href={`/admin/inventory/adjustments/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Ver detalle
      </Link>
    ),
  },
]

type Props = {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function AdjustmentsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('inventory.adjustments.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('inventory.adjustments.create')

  const sp          = await searchParams
  const adjustments = await getAdjustments({
    status: sp.status || undefined,
    search: sp.search || undefined,
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Ajustes de inventario"
        description="Correcciones de diferencias entre el inventario físico y el sistema"
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Ajustes' },
        ]}
        actions={
          canCreate ? (
            <Link href="/admin/inventory/adjustments/new">
              <Button size="sm">
                <IconPlus size={14} />
                Nuevo ajuste
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<Skeleton className="h-9 w-full max-w-lg" />}>
        <AdjustmentFiltersBar />
      </Suspense>

      {adjustments.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Sin ajustes registrados"
          description="Los ajustes de inventario aparecerán aquí cuando se registre el primero."
          action={
            canCreate ? (
              <Link href="/admin/inventory/adjustments/new">
                <Button size="sm">
                  <IconPlus size={14} />
                  Nuevo ajuste
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={adjustments}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
