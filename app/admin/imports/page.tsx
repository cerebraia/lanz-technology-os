import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getImports,
  getImportStats,
  IMPORT_STATUS_LABELS,
  SHIPPING_METHOD_LABELS,
  type Import,
  type ImportFilters,
} from '@/features/imports/data/imports'
import { ImportFilters as ImportFiltersComponent } from '@/features/imports/components/import-filters'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card }        from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { Skeleton }    from '@/components/ui/skeleton'
import { IconGlobe, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Importaciones' }

// ─── Stats ────────────────────────────────────────────────────────────────────

async function StatsPanel() {
  const stats = await getImportStats()

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Importaciones activas',  value: stats.active,    color: 'text-lz-text'    },
        { label: 'En tránsito',            value: stats.inTransit, color: 'text-lz-warning'  },
        {
          label: 'Costo logístico total',
          value: `USD ${stats.logCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          color: 'text-lz-text',
        },
        { label: 'Completadas',            value: stats.completed, color: 'text-lz-success'  },
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
    key:    'reference',
    header: 'Referencia',
    render: (row: Import) => (
      <Link
        href={`/admin/imports/${row.id}`}
        className="font-medium text-lz-text transition-colors hover:text-lz-accent"
      >
        {row.reference}
      </Link>
    ),
  },
  {
    key:    'status',
    header: 'Estado',
    render: (row: Import) => {
      const s = IMPORT_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key:       'origin_country',
    header:    'Origen',
    className: 'hidden sm:table-cell',
    render:    (row: Import) => (
      <span className="text-xs text-lz-muted">{row.origin_country}</span>
    ),
  },
  {
    key:       'shipping_method',
    header:    'Envío',
    className: 'hidden md:table-cell',
    render:    (row: Import) => (
      <span className="text-xs text-lz-muted">
        {row.shipping_method ? SHIPPING_METHOD_LABELS[row.shipping_method] : '—'}
      </span>
    ),
  },
  {
    key:       'estimated_arrival',
    header:    'Llegada est.',
    className: 'hidden lg:table-cell',
    render:    (row: Import) => (
      <span className="text-xs text-lz-muted">
        {row.estimated_arrival
          ? new Date(row.estimated_arrival + 'T00:00:00').toLocaleDateString('es-MX', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : '—'}
      </span>
    ),
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: Import) => (
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/admin/imports/${row.id}/edit`}
          className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
        >
          Editar
        </Link>
        <Link
          href={`/admin/imports/${row.id}`}
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
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function ImportsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('imports.read')
  if (!canRead) redirect('/admin')

  const canCreate = await checkPermission('imports.create')
  const sp        = await searchParams
  const filters: ImportFilters = {
    search: sp.search || undefined,
    status: sp.status || undefined,
  }
  const imports = await getImports(filters)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Importaciones"
        description="Control de lotes de mercancía importados internacionalmente."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Importaciones' },
        ]}
        actions={
          canCreate ? (
            <Link
              href="/admin/imports/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              <IconPlus size={14} />
              Nueva importación
            </Link>
          ) : undefined
        }
      />

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

      <ImportFiltersComponent />

      {imports.length === 0 ? (
        <EmptyState
          icon={<IconGlobe size={22} className="text-lz-muted" />}
          title="Sin importaciones registradas"
          description="Registra un lote de importación para hacer seguimiento de tu mercancía internacional."
          action={
            canCreate ? (
              <Link
                href="/admin/imports/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
              >
                <IconPlus size={14} />
                Nueva importación
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={imports}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
