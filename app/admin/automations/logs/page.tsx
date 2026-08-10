import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getRunHistory } from '@/features/automations/data/runs'
import { RUN_STATUS_LABELS } from '@/features/automations/data/constants'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconSettings } from '@/components/icons'

export const metadata: Metadata = { title: 'Logs de automatizaciones' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default async function LogsPage() {
  await verifySession()
  const canRead = await checkPermission('automations.read')
  if (!canRead) redirect('/admin/automations')

  const runs = await getRunHistory(200)
  const failed = runs.filter((r) => r.status === 'failed')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Logs de ejecución"
        description="Registro detallado de todas las ejecuciones del motor de automatizaciones."
        breadcrumbs={[
          { label: 'Dashboard',        href: '/admin' },
          { label: 'Automatizaciones', href: '/admin/automations' },
          { label: 'Logs' },
        ]}
      />

      {/* Failed runs summary */}
      {failed.length > 0 && (
        <Card>
          <p className="mb-3 text-sm font-semibold text-lz-danger">Ejecuciones fallidas ({failed.length})</p>
          <ul className="space-y-2">
            {failed.map((r) => (
              <li key={r.id} className="flex items-start gap-3 rounded-lg border border-lz-danger/20 bg-lz-danger/5 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/automations/${r.automation_id}`} className="text-xs font-medium text-lz-text hover:text-lz-accent">
                      {(r as { automations?: { name?: string } }).automations?.name ?? r.automation_id.slice(0, 8)}
                    </Link>
                    <span className="text-[11px] text-lz-muted">{fmtDate(r.started_at)}</span>
                  </div>
                  {r.error_message && (
                    <p className="mt-0.5 text-xs text-lz-danger">{r.error_message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Full log list */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Log completo</p>
          <p className="text-xs text-lz-muted">{runs.length} entradas</p>
        </CardHeader>
        <CardBody>
          {runs.length === 0 ? (
            <EmptyState icon={<IconSettings size={20} className="text-lz-muted" />} title="Sin logs" description="Los logs aparecerán cuando se ejecuten automatizaciones." />
          ) : (
            <ol className="space-y-1 font-mono text-[11px]">
              {runs.map((r) => {
                const s      = RUN_STATUS_LABELS[r.status]
                const result = r.result as Record<string, unknown> | null
                const msg    = r.error_message ?? (result?.message ? String(result.message) : '')
                return (
                  <li key={r.id} className="flex items-start gap-3 border-b border-lz-border/30 py-1.5 last:border-0">
                    <span className="shrink-0 text-lz-muted">{fmtDate(r.started_at)}</span>
                    <Badge variant={s?.variant ?? 'neutral'} className="shrink-0">{r.status.toUpperCase()}</Badge>
                    <Link href={`/admin/automations/${r.automation_id}`} className="shrink-0 text-lz-accent hover:underline">
                      {(r as { automations?: { name?: string } }).automations?.name ?? r.automation_id.slice(0, 8)}
                    </Link>
                    <span className={['truncate', r.error_message ? 'text-lz-danger' : 'text-lz-muted'].join(' ')}>
                      {msg}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
