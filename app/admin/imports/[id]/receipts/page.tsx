import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import { getImportReceipts, type ImportReceipt } from '@/features/imports/data/receipts'
import { RECEIPT_STATUS_LABELS } from '@/features/imports/data/constants'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconPackage, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Recepciones de importación' }

type Props = { params: Promise<{ id: string }> }

const COLUMNS = [
  {
    key:    'reference',
    header: 'Referencia',
    render: (row: ImportReceipt) => (
      <Link
        href={`/admin/imports/${row.import_id}/receipts/${row.id}`}
        className="font-medium text-lz-text transition-colors hover:text-lz-accent"
      >
        {row.reference}
      </Link>
    ),
  },
  {
    key:    'status',
    header: 'Estado',
    render: (row: ImportReceipt) => {
      const s = RECEIPT_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key:       'received_at',
    header:    'Fecha recepción',
    className: 'hidden md:table-cell',
    render:    (row: ImportReceipt) => (
      <span className="text-xs text-lz-muted">
        {row.received_at
          ? new Date(row.received_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </span>
    ),
  },
  {
    key:       'created_at',
    header:    'Creada',
    className: 'hidden lg:table-cell',
    render:    (row: ImportReceipt) => (
      <span className="text-xs text-lz-muted">
        {new Date(row.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  {
    key:       'actions',
    header:    '',
    className: 'text-right',
    render:    (row: ImportReceipt) => (
      <Link
        href={`/admin/imports/${row.import_id}/receipts/${row.id}`}
        className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
      >
        Ver
      </Link>
    ),
  },
]

export default async function ImportReceiptsPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead = await checkPermission('imports.receipts.read')
  if (!canRead) redirect('/admin')

  const canCreate = await checkPermission('imports.receipts.create')

  const [imp, receipts] = await Promise.all([
    getImportById(id),
    getImportReceipts(id),
  ])

  if (!imp) notFound()

  const isReceivable = !['received', 'cancelled', 'planning', 'purchased'].includes(imp.status)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Recepciones"
        description={`Importación ${imp.reference}`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Recepciones' },
        ]}
        actions={
          canCreate && isReceivable ? (
            <Link
              href={`/admin/imports/${id}/receipts/new`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
            >
              <IconPlus size={14} />
              Registrar recepción
            </Link>
          ) : undefined
        }
      />

      {receipts.length === 0 ? (
        <EmptyState
          icon={<IconPackage size={22} className="text-lz-muted" />}
          title="Sin recepciones registradas"
          description="Las recepciones de mercancía de esta importación aparecerán aquí."
          action={
            canCreate && isReceivable ? (
              <Link
                href={`/admin/imports/${id}/receipts/new`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
              >
                <IconPlus size={14} />
                Registrar recepción
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table columns={COLUMNS} rows={receipts} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
