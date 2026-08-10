import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getRunHistory, type RunWithAutomation } from '@/features/automations/data/runs'
import { RUN_STATUS_LABELS, TRIGGER_LABELS, ACTION_LABELS } from '@/features/automations/data/constants'
import { PageHeader } from '@/components/ui/page-header'
import { Badge }      from '@/components/ui/badge'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Card }       from '@/components/ui/card'
import { IconSettings } from '@/components/icons'

export const metadata: Metadata = { title: 'Historial de ejecuciones' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const COLUMNS = [
  {
    key: 'automation', header: 'Automatización',
    render: (row: RunWithAutomation) => {
      const t = row.automations?.trigger_type ? TRIGGER_LABELS[row.automations.trigger_type] : null
      const a = row.automations?.action_type  ? ACTION_LABELS[row.automations.action_type]   : null
      return (
        <div>
          <Link href={`/admin/automations/${row.automation_id}`} className="text-sm font-medium text-lz-text hover:text-lz-accent transition-colors">
            {row.automations?.name ?? '—'}
          </Link>
          {t && a && (
            <p className="text-[11px] text-lz-muted">{t.icon} {t.label} → {a.icon} {a.label}</p>
          )}
        </div>
      )
    },
  },
  {
    key: 'status', header: 'Estado',
    render: (row: RunWithAutomation) => {
      const s = RUN_STATUS_LABELS[row.status]
      return <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? row.status}</Badge>
    },
  },
  {
    key: 'triggered_by', header: 'Origen', className: 'hidden sm:table-cell',
    render: (row: RunWithAutomation) => (
      <span className="text-xs text-lz-muted capitalize">
        {row.triggered_by?.replace('trigger:', '') ?? 'manual'}
      </span>
    ),
  },
  {
    key: 'started_at', header: 'Ejecutado',
    render: (row: RunWithAutomation) => (
      <span className="text-xs text-lz-muted">{fmtDate(row.started_at)}</span>
    ),
  },
  {
    key: 'result', header: 'Mensaje', className: 'hidden md:table-cell',
    render: (row: RunWithAutomation) => {
      const result = row.result as Record<string, unknown> | null
      const text   = row.error_message ?? (result?.message ? String(result.message) : null)
      return <span className={['text-xs', row.error_message ? 'text-lz-danger' : 'text-lz-muted'].join(' ')}>{text?.slice(0, 70) ?? '—'}</span>
    },
  },
]

export default async function HistoryPage() {
  await verifySession()
  const canRead = await checkPermission('automations.read')
  if (!canRead) redirect('/admin/automations')

  const runs = await getRunHistory()
  const completed = runs.filter((r) => r.status === 'completed').length
  const failed    = runs.filter((r) => r.status === 'failed').length

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Historial de ejecuciones"
        description={`Últimas ${runs.length} ejecuciones`}
        breadcrumbs={[
          { label: 'Dashboard',        href: '/admin' },
          { label: 'Automatizaciones', href: '/admin/automations' },
          { label: 'Historial' },
        ]}
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',       value: runs.length,  color: 'text-lz-text'    },
          { label: 'Completadas', value: completed,    color: 'text-lz-success' },
          { label: 'Fallidas',    value: failed,       color: failed > 0 ? 'text-lz-danger' : 'text-lz-muted' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <p className={['text-2xl font-bold tabular-nums', color].join(' ')}>{value}</p>
            <p className="text-xs text-lz-muted">{label}</p>
          </Card>
        ))}
      </div>

      {runs.length === 0 ? (
        <EmptyState icon={<IconSettings size={22} className="text-lz-muted" />} title="Sin ejecuciones" description="Las ejecuciones aparecerán aquí cuando se activen las automatizaciones." />
      ) : (
        <Table columns={COLUMNS} rows={runs} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
