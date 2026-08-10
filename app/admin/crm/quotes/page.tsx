import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getQuotes, type QuoteWithCustomer } from '@/features/crm/data/quotes'
import { QUOTE_STATUS_LABELS } from '@/features/crm/data/constants'
import { QuoteStatusButtons } from '@/features/crm/components/quote-status-buttons'
import { PageHeader } from '@/components/ui/page-header'
import { Table }      from '@/components/ui/table'
import { Badge }      from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { IconClipboard, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Cotizaciones' }

type Props = { searchParams: Promise<{ status?: string }> }

const COLUMNS = (canUpdate: boolean) => [
  {
    key: 'customer', header: 'Cliente',
    render: (row: QuoteWithCustomer) => {
      const name = row.customers
        ? `${row.customers.first_name} ${row.customers.last_name ?? ''}`.trim()
        : '—'
      return (
        <div>
          <p className="text-sm font-medium text-lz-text">{name}</p>
          <p className="text-xs text-lz-muted">
            {new Date(row.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )
    },
  },
  {
    key: 'total', header: 'Total', className: 'text-right',
    render: (row: QuoteWithCustomer) => (
      <span className="tabular-nums text-sm font-semibold text-lz-text">
        USD {row.total.toFixed(2)}
      </span>
    ),
  },
  {
    key: 'expires_at', header: 'Vence', className: 'hidden sm:table-cell',
    render: (row: QuoteWithCustomer) => (
      <span className="text-xs text-lz-muted">
        {row.expires_at
          ? new Date(row.expires_at + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </span>
    ),
  },
  {
    key: 'status', header: 'Estado',
    render: (row: QuoteWithCustomer) => {
      const s = QUOTE_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key: 'actions', header: '', className: 'text-right',
    render: (row: QuoteWithCustomer) => (
      <QuoteStatusButtons quoteId={row.id} currentStatus={row.status} canUpdate={canUpdate} />
    ),
  },
]

export default async function QuotesPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('crm.read')
  if (!canRead) redirect('/admin/crm')
  const canCreate = await checkPermission('crm.quotes.create')
  const canUpdate = await checkPermission('crm.quotes.update')

  const sp     = await searchParams
  const quotes = await getQuotes(sp.status)

  const open     = quotes.filter((q) => ['draft','sent'].includes(q.status))
  const accepted = quotes.filter((q) => q.status === 'accepted')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Cotizaciones"
        breadcrumbs={[
          { label: 'Dashboard',    href: '/admin' },
          { label: 'CRM',          href: '/admin/crm' },
          { label: 'Cotizaciones' },
        ]}
        actions={canCreate ? (
          <Link
            href="/admin/crm/quotes/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nueva cotización
          </Link>
        ) : undefined}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Abiertas',  value: open.length,                                     color: 'text-lz-text' },
          { label: 'Aceptadas', value: accepted.length,                                 color: 'text-lz-success' },
          { label: 'Total USD', value: `USD ${accepted.reduce((a,q)=>a+q.total,0).toFixed(2)}`, color: 'text-lz-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-lz-border bg-lz-surface p-4 text-center">
            <p className={['text-xl font-semibold tabular-nums', color].join(' ')}>{value}</p>
            <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {[{ value: '', label: 'Todas' }, ...Object.entries(QUOTE_STATUS_LABELS).map(([v, s]) => ({ value: v, label: s.label }))].map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `?status=${value}` : '/admin/crm/quotes'}
            className={['rounded-full px-3 py-1 text-xs font-medium transition-colors', (sp.status ?? '') === value ? 'bg-lz-primary text-white' : 'border border-lz-border text-lz-muted hover:text-lz-text'].join(' ')}
          >
            {label}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<IconClipboard size={22} className="text-lz-muted" />}
          title="Sin cotizaciones"
          description="Crea cotizaciones para enviar propuestas de precio a tus clientes."
        />
      ) : (
        <Table columns={COLUMNS(canUpdate)} rows={quotes} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
