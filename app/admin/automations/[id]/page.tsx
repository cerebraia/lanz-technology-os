import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getAutomationById } from '@/features/automations/data/automations'
import { getRunsByAutomation } from '@/features/automations/data/runs'
import { TRIGGER_LABELS, ACTION_LABELS, RUN_STATUS_LABELS } from '@/features/automations/data/constants'
import { ExecuteButton } from '@/features/automations/components/execute-button'
import { ToggleButton }  from '@/features/automations/components/toggle-button'
import { PageHeader }    from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }         from '@/components/ui/badge'
import { deleteAutomationAction } from '@/features/automations/actions/automation-actions'

export const metadata: Metadata = { title: 'Automatización' }

type Props = { params: Promise<{ id: string }> }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AutomationDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()
  const canRead    = await checkPermission('automations.read')
  if (!canRead) redirect('/admin/automations')
  const canUpdate  = await checkPermission('automations.update')
  const canDelete  = await checkPermission('automations.delete')
  const canExecute = await checkPermission('automations.execute')

  const [automation, runs] = await Promise.all([
    getAutomationById(id),
    getRunsByAutomation(id),
  ])

  if (!automation) notFound()

  const trigger = TRIGGER_LABELS[automation.trigger_type]
  const action  = ACTION_LABELS[automation.action_type]

  const configStr = JSON.stringify(automation.config, null, 2)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={automation.name}
        description={automation.description ?? undefined}
        breadcrumbs={[
          { label: 'Dashboard',        href: '/admin' },
          { label: 'Automatizaciones', href: '/admin/automations' },
          { label: automation.name },
        ]}
        secondaryActions={
          <ToggleButton id={automation.id} enabled={automation.enabled} canUpdate={canUpdate} />
        }
        actions={
          <ExecuteButton automationId={automation.id} enabled={automation.enabled} canExecute={canExecute} />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — config */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <p className="mb-3 text-sm font-semibold text-lz-text">Configuración</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-lz-muted">Trigger</p>
                <p className="mt-0.5 text-sm text-lz-text">{trigger?.icon} {trigger?.label ?? automation.trigger_type}</p>
                <p className="text-[11px] text-lz-muted">{trigger?.description}</p>
              </div>
              <div>
                <p className="text-xs text-lz-muted">Acción</p>
                <p className="mt-0.5 text-sm text-lz-text">{action?.icon} {action?.label ?? automation.action_type}</p>
                <p className="text-[11px] text-lz-muted">{action?.description}</p>
              </div>
              <div>
                <p className="text-xs text-lz-muted">Total ejecuciones</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-lz-text">{automation.run_count}</p>
              </div>
              {automation.last_run_at && (
                <div>
                  <p className="text-xs text-lz-muted">Última ejecución</p>
                  <p className="mt-0.5 text-xs text-lz-text">{fmtDate(automation.last_run_at)}</p>
                </div>
              )}
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">JSON de configuración</p></CardHeader>
            <CardBody>
              <pre className="overflow-x-auto rounded-lg bg-lz-surface-hover/40 p-3 text-[11px] text-lz-text leading-relaxed">
                {configStr}
              </pre>
            </CardBody>
          </Card>

          {canDelete && (
            <form action={async () => { 'use server'; await deleteAutomationAction(id) }}>
              <button
                type="submit"
                className="text-xs text-lz-muted transition-colors hover:text-lz-danger"
              >
                Eliminar automatización
              </button>
            </form>
          )}
        </div>

        {/* Right — run history */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Historial de ejecuciones</p>
              <p className="text-xs text-lz-muted">{runs.length} ejecuciones</p>
            </CardHeader>
            {runs.length === 0 ? (
              <CardBody><p className="text-sm text-lz-muted">Sin ejecuciones aún. Usa &quot;Ejecutar ahora&quot; para probarla.</p></CardBody>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-lz-border text-xs text-lz-muted">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                      <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Trigger</th>
                      <th className="px-4 py-2.5 text-left font-medium">Inicio</th>
                      <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lz-border/50">
                    {runs.map((run) => {
                      const s = RUN_STATUS_LABELS[run.status]
                      const result = run.result as Record<string, unknown> | null
                      return (
                        <tr key={run.id} className="hover:bg-lz-surface/60">
                          <td className="px-4 py-2.5">
                            <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? run.status}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-lz-muted hidden sm:table-cell capitalize">
                            {run.triggered_by?.replace('trigger:', '') ?? 'manual'}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-lz-muted">{fmtDate(run.started_at)}</td>
                          <td className="px-4 py-2.5 text-xs text-lz-muted hidden md:table-cell">
                            {run.error_message
                              ? <span className="text-lz-danger">{run.error_message}</span>
                              : result?.message
                                ? String(result.message).slice(0, 80)
                                : '—'
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
