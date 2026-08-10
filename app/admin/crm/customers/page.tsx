import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCustomers, type CustomerWithTags } from '@/features/crm/data/customers'
import { getTags } from '@/features/crm/data/tags'
import { TagBadge } from '@/features/crm/components/tag-badge'
import { PageHeader } from '@/components/ui/page-header'
import { Table }      from '@/components/ui/table'
import { Badge }      from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { IconUsers, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Clientes' }

type Props = { searchParams: Promise<{ search?: string; tag?: string }> }

const COLUMNS = [
  {
    key: 'name', header: 'Cliente',
    render: (row: CustomerWithTags) => (
      <div>
        <Link
          href={`/admin/crm/customers/${row.id}`}
          className="font-medium text-lz-text transition-colors hover:text-lz-accent"
        >
          {row.first_name} {row.last_name ?? ''}
        </Link>
        {row.company && <p className="text-xs text-lz-muted">{row.company}</p>}
      </div>
    ),
  },
  {
    key: 'contact', header: 'Contacto', className: 'hidden sm:table-cell',
    render: (row: CustomerWithTags) => (
      <div>
        {row.email && <p className="text-xs text-lz-muted">{row.email}</p>}
        {row.phone && <p className="text-xs text-lz-muted">{row.phone}</p>}
      </div>
    ),
  },
  {
    key: 'location', header: 'Ubicación', className: 'hidden md:table-cell',
    render: (row: CustomerWithTags) => (
      <span className="text-xs text-lz-muted">
        {[row.city, row.country].filter(Boolean).join(', ') || '—'}
      </span>
    ),
  },
  {
    key: 'tags', header: 'Etiquetas',
    render: (row: CustomerWithTags) => (
      <div className="flex flex-wrap gap-1">
        {row.customer_tag_assignments?.map((a) =>
          a.customer_tags ? (
            <TagBadge key={a.customer_tags.id} name={a.customer_tags.name} color={a.customer_tags.color} size="xs" />
          ) : null
        )}
      </div>
    ),
  },
  {
    key: 'status', header: 'Estado',
    render: (row: CustomerWithTags) => (
      row.archived_at
        ? <Badge variant="neutral">Archivado</Badge>
        : <Badge variant="success">Activo</Badge>
    ),
  },
]

export default async function CustomersPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('crm.read')
  if (!canRead) redirect('/admin/crm')
  const canCreate = await checkPermission('crm.create')

  const sp       = await searchParams
  const [customers, tags] = await Promise.all([
    getCustomers({ search: sp.search, tag: sp.tag }),
    getTags(),
  ])

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Clientes"
        description={`${customers.length} cliente${customers.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'CRM', href: '/admin/crm' }, { label: 'Clientes' }]}
        actions={canCreate ? (
          <Link
            href="/admin/crm/customers/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nuevo cliente
          </Link>
        ) : undefined}
      />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <input
          type="search"
          name="search"
          placeholder="Buscar nombre, email, empresa…"
          defaultValue={sp.search ?? ''}
          className="h-9 w-full rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text placeholder:text-lz-muted/60 focus:outline-none focus:ring-2 focus:ring-lz-primary/50 sm:w-60"
        />
        <select
          name="tag"
          defaultValue={sp.tag ?? ''}
          className="h-9 rounded-lg border border-lz-border bg-lz-surface px-3 text-sm text-lz-text focus:outline-none focus:ring-2 focus:ring-lz-primary/50"
        >
          <option value="">Todas las etiquetas</option>
          {tags.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
        >
          Buscar
        </button>
        {(sp.search || sp.tag) && (
          <Link href="/admin/crm/customers" className="h-9 inline-flex items-center px-3 text-xs text-lz-muted hover:text-lz-text">
            Limpiar
          </Link>
        )}
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} className="text-lz-muted" />}
          title="Sin clientes"
          description="Agrega tu primer cliente para empezar a gestionar relaciones comerciales."
          action={canCreate ? (
            <Link href="/admin/crm/customers/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nuevo cliente
            </Link>
          ) : undefined}
        />
      ) : (
        <Table columns={COLUMNS} rows={customers} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
