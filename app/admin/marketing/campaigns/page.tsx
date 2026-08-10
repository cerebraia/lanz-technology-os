import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCampaigns, type CampaignWithSegment } from '@/features/marketing/data/campaigns'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '@/features/marketing/data/constants'
import { CampaignStatusActions } from '@/features/marketing/components/campaign-status-actions'
import { PageHeader } from '@/components/ui/page-header'
import { Badge }      from '@/components/ui/badge'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { IconMegaphone, IconPlus } from '@/components/icons'

export const metadata: Metadata = { title: 'Campañas' }

type Props = { searchParams: Promise<{ status?: string }> }

const COLUMNS = (canUpdate: boolean) => [
  {
    key: 'name', header: 'Campaña',
    render: (row: CampaignWithSegment) => {
      const t = CAMPAIGN_TYPE_LABELS[row.type]
      return (
        <div>
          <p className="text-sm font-medium text-lz-text">{row.name}</p>
          <span className="text-xs font-medium" style={{ color: t?.color ?? '#888' }}>{t?.label ?? row.type}</span>
        </div>
      )
    },
  },
  {
    key: 'segment', header: 'Segmento', className: 'hidden sm:table-cell',
    render: (row: CampaignWithSegment) => (
      <span className="text-xs text-lz-muted">{row.customer_segments?.name ?? '—'}</span>
    ),
  },
  {
    key: 'dates', header: 'Período', className: 'hidden md:table-cell',
    render: (row: CampaignWithSegment) => (
      <span className="text-xs text-lz-muted">
        {row.start_date ?? '—'}{row.end_date ? ` → ${row.end_date}` : ''}
      </span>
    ),
  },
  {
    key: 'budget', header: 'Presupuesto', className: 'text-right hidden sm:table-cell',
    render: (row: CampaignWithSegment) => (
      <span className="tabular-nums text-xs text-lz-muted">
        {row.budget !== null ? `${row.currency} ${row.budget.toFixed(2)}` : '—'}
      </span>
    ),
  },
  {
    key: 'status', header: 'Estado',
    render: (row: CampaignWithSegment) => {
      const s = CAMPAIGN_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key: 'actions', header: '', className: 'text-right',
    render: (row: CampaignWithSegment) => (
      <CampaignStatusActions campaignId={row.id} status={row.status} canUpdate={canUpdate} />
    ),
  },
]

export default async function CampaignsPage({ searchParams }: Props) {
  await verifySession()
  const canRead   = await checkPermission('marketing.read')
  if (!canRead) redirect('/admin/marketing')
  const canCreate = await checkPermission('marketing.create')
  const canUpdate = await checkPermission('marketing.update')

  const sp        = await searchParams
  const campaigns = await getCampaigns(sp.status)

  const statusFilters = [
    { value: '',          label: 'Todas' },
    { value: 'draft',     label: 'Borradores' },
    { value: 'active',    label: 'Activas' },
    { value: 'paused',    label: 'Pausadas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Campañas"
        description={`${campaigns.length} campaña${campaigns.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'Campañas' },
        ]}
        actions={canCreate ? (
          <Link href="/admin/marketing/campaigns/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nueva campaña
          </Link>
        ) : undefined}
      />

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ value, label }) => (
          <Link key={value} href={value ? `?status=${value}` : '/admin/marketing/campaigns'}
            className={['rounded-full px-3 py-1 text-xs font-medium transition-colors', (sp.status ?? '') === value ? 'bg-lz-primary text-white' : 'border border-lz-border text-lz-muted hover:text-lz-text'].join(' ')}
          >
            {label}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<IconMegaphone size={22} className="text-lz-muted" />}
          title="Sin campañas"
          description="Crea campañas para llegar a tus clientes y medir resultados."
          action={canCreate ? (
            <Link href="/admin/marketing/campaigns/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nueva campaña
            </Link>
          ) : undefined}
        />
      ) : (
        <Table columns={COLUMNS(canUpdate)} rows={campaigns} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
