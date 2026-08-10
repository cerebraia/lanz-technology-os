import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getEntries,
  ENTRY_TYPE_LABELS,
  ENTRY_STATUS_LABELS,
  ENTRY_TYPE_OPTIONS,
  type InventoryEntry,
} from '@/features/inventory/data/entries'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Table } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { IconBox, IconPlus } from '@/components/icons'
import { EntryFiltersBar } from '@/features/inventory/components/entry-filters'

export const metadata: Metadata = { title: 'Entradas de mercancía' }

const COLUMNS = [
  {
    key: 'reference',
    header: 'Referencia',
    render: (row: InventoryEntry) => (
      <div>
        <Link
          href={`/admin/inventory/entries/${row.id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.reference}
        </Link>
        {row.supplier_name && (
          <p className="mt-0.5 text-xs text-lz-muted">{row.supplier_name}</p>
        )}
      </div>
    ),
  },
  {
    key: 'entry_type',
    header: 'Tipo',
    className: 'hidden sm:table-cell',
    render: (row: InventoryEntry) => (
      <span className="text-xs text-lz-muted">
        {ENTRY_TYPE_LABELS[row.entry_type] ?? row.entry_type}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Estado',
    render: (row: InventoryEntry) => {
      const s = ENTRY_STATUS_LABELS[row.status] ?? { label: row.status, variant: 'neutral' as const }
      return <Badge variant={s.variant}>{s.label}</Badge>
    },
  },
  {
    key: 'total_units',
    header: 'Unidades',
    className: 'text-right hidden md:table-cell',
    render: (row: InventoryEntry) => (
      <span className="tabular-nums text-sm text-lz-text">{row.total_units}</span>
    ),
  },
  {
    key: 'user',
    header: 'Usuario',
    className: 'hidden lg:table-cell',
    render: (row: InventoryEntry) => (
      <span className="text-xs text-lz-muted">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(row as any).created_by_profile?.full_name ?? '—'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Fecha',
    className: 'hidden md:table-cell',
    render: (row: InventoryEntry) => (
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
    render: (row: InventoryEntry) => (
      <Link
        href={`/admin/inventory/entries/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Ver detalle
      </Link>
    ),
  },
]

type Props = {
  searchParams: Promise<{ status?: string; type?: string; search?: string }>
}

export default async function EntriesPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('inventory.entries.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('inventory.entries.create')

  const sp      = await searchParams
  const entries = await getEntries({
    status:    sp.status || undefined,
    entryType: sp.type   || undefined,
    search:    sp.search || undefined,
  })

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Entradas de mercancía"
        description="Recepciones de stock confirmadas e historial de borradores"
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Entradas' },
        ]}
        actions={
          canCreate ? (
            <Link href="/admin/inventory/entries/new">
              <Button size="sm">
                <IconPlus size={14} />
                Nueva entrada
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<Skeleton className="h-9 w-full max-w-2xl" />}>
        <EntryFiltersBar typeOptions={ENTRY_TYPE_OPTIONS} />
      </Suspense>

      {entries.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Sin entradas registradas"
          description="Crea la primera entrada de mercancía para comenzar a cargar inventario."
          action={
            canCreate ? (
              <Link href="/admin/inventory/entries/new">
                <Button size="sm">
                  <IconPlus size={14} />
                  Nueva entrada
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          columns={COLUMNS}
          rows={entries}
          keyExtractor={(row) => row.id}
        />
      )}
    </div>
  )
}
