import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getSuppliers,
  getSupplierStats,
  getSupplierCountries,
  type SupplierWithStats,
  type SupplierFilters,
} from '@/features/suppliers/data/suppliers'
import { SupplierFilters as SupplierFiltersComponent } from '@/features/suppliers/components/supplier-filters'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card }        from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { Skeleton }    from '@/components/ui/skeleton'
import { IconUsers, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Proveedores' }

// ─── Stats ────────────────────────────────────────────────────────────────────

async function StatsPanel() {
  const stats = await getSupplierStats()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Activos',          value: stats.active,      color: 'text-lz-success' },
        { label: 'Inactivos',        value: stats.inactive,    color: 'text-lz-muted'   },
        { label: 'Órdenes asociadas', value: stats.totalOrders, color: 'text-lz-text'    },
        {
          label: 'Monto total comprado',
          value: `USD ${stats.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          color: 'text-lz-text',
        },
      ].map(({ label, value, color }) => (
        <Card key={label} className="text-center">
          <p className={['text-xl font-semibold tracking-tight', color].join(' ')}>{value}</p>
          <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
        </Card>
      ))}
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key:    'name',
    header: 'Proveedor',
    render: (row: SupplierWithStats) => (
      <div>
        <Link
          href={`/admin/suppliers/${row.id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.name}
        </Link>
        {row.company && (
          <p className="mt-0.5 text-xs text-lz-muted">{row.company}</p>
        )}
      </div>
    ),
  },
  {
    key:       'country',
    header:    'País',
    className: 'hidden md:table-cell',
    render:    (row: SupplierWithStats) => (
      <span className="text-xs text-lz-muted">{row.country}</span>
    ),
  },
  {
    key:       'email',
    header:    'Email',
    className: 'hidden lg:table-cell',
    render:    (row: SupplierWithStats) => (
      <span className="text-xs text-lz-muted">{row.email ?? '—'}</span>
    ),
  },
  {
    key:       'phone',
    header:    'Teléfono',
    className: 'hidden lg:table-cell',
    render:    (row: SupplierWithStats) => (
      <span className="text-xs text-lz-muted">{row.phone ?? '—'}</span>
    ),
  },
  {
    key:       'total_orders',
    header:    'Órdenes',
    className: 'text-right hidden sm:table-cell',
    render:    (row: SupplierWithStats) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.total_orders}</span>
    ),
  },
  {
    key:    'status',
    header: 'Estado',
    render: (row: SupplierWithStats) =>
      row.is_active
        ? <Badge variant="success">Activo</Badge>
        : <Badge variant="neutral">Inactivo</Badge>,
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: SupplierWithStats) => (
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/suppliers/${row.id}/edit`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
        >
          Editar
        </Link>
        <Link
          href={`/admin/suppliers/${row.id}`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
        >
          Ver
        </Link>
      </div>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{ search?: string; country?: string; active?: string }>
}

export default async function SuppliersPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('suppliers.read')
  if (!canRead) redirect('/admin')

  const canCreate = await checkPermission('suppliers.create')
  const sp        = await searchParams
  const countries = await getSupplierCountries()

  const filters: SupplierFilters = {
    search:   sp.search  || undefined,
    country:  sp.country || undefined,
    isActive: sp.active === 'true' ? true : sp.active === 'false' ? false : '',
  }
  const suppliers = await getSuppliers(filters)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores de mercancía. Vinculados a órdenes de compra e importaciones."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Compras',   href: '/admin/purchases' },
          { label: 'Proveedores' },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/admin/suppliers/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              <IconPlus size={14} />
              Nuevo proveedor
            </Link>
          ) : undefined
        }
      />

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="space-y-2">
                <Skeleton className="mx-auto h-6 w-20" />
                <Skeleton className="mx-auto h-3 w-28" />
              </Card>
            ))}
          </div>
        }
      >
        <StatsPanel />
      </Suspense>

      {/* Filtros */}
      <SupplierFiltersComponent countries={countries} />

      {/* Tabla */}
      {suppliers.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} className="text-lz-muted" />}
          title="Sin proveedores registrados"
          description="Registra los proveedores de mercancía para vincularlos a tus órdenes de compra."
          action={
            canCreate ? (
              <Link
                href="/admin/suppliers/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
              >
                <IconPlus size={14} />
                Nuevo proveedor
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={suppliers}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
