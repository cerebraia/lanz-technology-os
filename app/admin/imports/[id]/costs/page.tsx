import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import { getCostAllocations, type CostAllocation } from '@/features/imports/data/costs'
import { ALLOCATION_METHOD_LABELS } from '@/features/imports/data/constants'
import { DeleteAllocationButton } from '@/features/imports/components/delete-allocation-button'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconDollar, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Distribución de costos' }

type Props = { params: Promise<{ id: string }> }

const COLUMNS = [
  {
    key:    'method',
    header: 'Método',
    render: (row: CostAllocation) => (
      <Badge variant="neutral">{ALLOCATION_METHOD_LABELS[row.allocation_method] ?? row.allocation_method}</Badge>
    ),
  },
  {
    key:    'total_amount',
    header: 'Total distribuido',
    render: (row: CostAllocation) => (
      <span className="tabular-nums text-sm font-medium text-lz-text">
        {row.currency} {row.total_amount.toFixed(2)}
      </span>
    ),
  },
  {
    key:       'created_at',
    header:    'Creada',
    className: 'hidden md:table-cell',
    render:    (row: CostAllocation) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  {
    key:       'notes',
    header:    'Notas',
    className: 'hidden lg:table-cell',
    render:    (row: CostAllocation) => (
      <span className="text-xs text-lz-muted">{row.notes ?? '—'}</span>
    ),
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: CostAllocation) => (
      <DeleteAllocationButton allocationId={row.id} importId={row.import_id} />
    ),
  },
]

export default async function CostsPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead     = await checkPermission('imports.costs.read')
  if (!canRead) redirect('/admin')

  const canAllocate = await checkPermission('imports.costs.allocate')

  const [imp, allocations] = await Promise.all([
    getImportById(id),
    getCostAllocations(id),
  ])

  if (!imp) notFound()

  const totalLogistics = imp.total_expenses
  const totalAllocated = allocations.reduce((acc, a) => acc + a.total_amount, 0)
  const unallocated    = Math.max(totalLogistics - totalAllocated, 0)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Distribución de costos"
        description={`Importación ${imp.reference}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Costos' },
        ]}
        actions={
          canAllocate ? (
            <Link
              href={`/admin/imports/${id}/costs/new`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              <IconPlus size={14} />
              Nueva distribución
            </Link>
          ) : undefined
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Costo logístico total', value: `USD ${totalLogistics.toFixed(2)}`,  color: 'text-lz-text'    },
          { label: 'Total distribuido',      value: `USD ${totalAllocated.toFixed(2)}`, color: 'text-lz-success' },
          { label: 'Sin distribuir',         value: `USD ${unallocated.toFixed(2)}`,   color: unallocated > 0 ? 'text-lz-warning' : 'text-lz-muted' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <p className={['text-xl font-semibold tracking-tight tabular-nums', color].join(' ')}>{value}</p>
            <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
          </Card>
        ))}
      </div>

      {/* Distribuciones */}
      <Card padding={false}>
        <CardHeader>
          <div>
            <p className="text-sm font-semibold text-lz-text">Distribuciones creadas</p>
            <p className="mt-0.5 text-xs text-lz-muted">
              {allocations.length} {allocations.length === 1 ? 'distribución' : 'distribuciones'}
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {allocations.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<IconDollar size={22} className="text-lz-muted" />}
                title="Sin distribuciones de costos"
                description="Distribuye los gastos logísticos entre los productos recibidos para calcular el costo real unitario."
                action={
                  canAllocate ? (
                    <Link
                      href={`/admin/imports/${id}/costs/new`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
                    >
                      <IconPlus size={14} />
                      Nueva distribución
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <Table columns={COLUMNS} rows={allocations} keyExtractor={(r) => r.id} />
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Link
          href={`/admin/imports/${id}/profitability`}
          className="inline-flex h-8 items-center rounded-lg border border-lz-border px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
        >
          Ver rentabilidad →
        </Link>
      </div>
    </div>
  )
}
