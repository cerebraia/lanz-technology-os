import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import {
  dismissInsightAction,
  persistAlertsAction,
  resolveAllAlertsAction,
} from '@/features/ai/actions/ai-actions'
import { PageHeader }  from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconAlertTriangle, IconCheck } from '@/components/icons'

export const metadata: Metadata = { title: 'Notificaciones' }

type AiInsight = {
  id:          string
  type:        string
  title:       string
  description: string
  priority:    'low' | 'medium' | 'high' | 'critical'
  metadata:    Record<string, unknown> | null
  resolved:    boolean
  created_at:  string
}

type Props = { searchParams: Promise<{ filter?: string }> }

const PRIORITY_VARIANT = {
  critical: 'danger',
  high:     'warning',
  medium:   'neutral',
  low:      'muted',
} as const

const PRIORITY_LABEL = {
  critical: 'Crítica',
  high:     'Alta',
  medium:   'Media',
  low:      'Baja',
} as const

const TYPE_LABEL: Record<string, string> = {
  inventory: 'Inventario',
  finance:   'Finanzas',
  import:    'Importaciones',
  sales:     'Ventas',
  marketing: 'Marketing',
  general:   'General',
}

const MODULE_HREF: Record<string, string> = {
  inventory: '/admin/inventory/alerts',
  finance:   '/admin/finance',
  import:    '/admin/imports',
  sales:     '/admin/orders',
}

async function getInsights(filter: string): Promise<AiInsight[]> {
  const supabase = await createClient()
  let q = supabase.from('ai_insights').select('*').order('created_at', { ascending: false })
  if (filter === 'unresolved') q = q.eq('resolved', false)
  else if (filter === 'resolved') q = q.eq('resolved', true)
  else if (['inventory', 'finance', 'import', 'sales', 'marketing'].includes(filter)) {
    q = q.eq('type', filter).eq('resolved', false)
  }
  const { data } = await q.limit(100)
  return (data ?? []) as AiInsight[]
}

async function getUnresolvedCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('resolved', false)
  return count ?? 0
}

export default async function NotificationsPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('ai.insights')
  if (!canRead) redirect('/admin')

  const sp     = await searchParams
  const filter = sp.filter ?? 'unresolved'

  const [insights, unresolvedCount] = await Promise.all([
    getInsights(filter),
    getUnresolvedCount(),
  ])

  const FILTERS = [
    { value: 'unresolved',  label: 'Sin resolver' },
    { value: 'inventory',   label: 'Inventario' },
    { value: 'finance',     label: 'Finanzas' },
    { value: 'import',      label: 'Importaciones' },
    { value: 'sales',       label: 'Ventas' },
    { value: 'resolved',    label: 'Resueltas' },
  ]

  const critical = insights.filter(i => i.priority === 'critical' && !i.resolved)

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Centro de notificaciones"
        description="Alertas automáticas y estado operativo del negocio."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Notificaciones' },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <Badge variant="warning">{unresolvedCount} pendiente{unresolvedCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        }
        actions={
          <div className="flex gap-2">
            {/* Scan & persist latest alerts */}
            <form action={persistAlertsAction}>
              <button
                type="submit"
                className="h-9 rounded-xl border border-lz-border px-4 text-xs font-medium text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
              >
                Escanear alertas
              </button>
            </form>
            {/* Resolve all */}
            {unresolvedCount > 0 && (
              <form action={resolveAllAlertsAction}>
                <button
                  type="submit"
                  className="h-9 rounded-xl border border-lz-success/30 bg-lz-success/10 px-4 text-xs font-medium text-lz-success transition-colors hover:bg-lz-success/20"
                >
                  Resolver todas
                </button>
              </form>
            )}
          </div>
        }
      />

      {/* Critical banner */}
      {critical.length > 0 && (
        <div className="rounded-xl border border-lz-danger/40 bg-lz-danger/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-lz-danger" />
            <div>
              <p className="text-sm font-semibold text-lz-danger">
                {critical.length} alerta{critical.length > 1 ? 's' : ''} crítica{critical.length > 1 ? 's' : ''} sin resolver
              </p>
              <p className="mt-0.5 text-xs text-lz-muted">
                {critical.map(a => a.title).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-lz-border bg-lz-surface p-1">
        {FILTERS.map(f => (
          <a
            key={f.value}
            href={`?filter=${f.value}`}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-lz-primary text-white'
                : 'text-lz-muted hover:text-lz-text',
            ].join(' ')}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Alerts list */}
      {insights.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCheck size={24} className="text-lz-success" />}
            title={filter === 'resolved' ? 'Sin alertas resueltas' : 'Sin alertas pendientes'}
            description={
              filter === 'resolved'
                ? 'No hay alertas marcadas como resueltas.'
                : 'Todo en orden. Usa "Escanear alertas" para verificar el estado del negocio.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {insights.map(insight => {
            const dismiss = dismissInsightAction.bind(null, insight.id)
            const actionHref = MODULE_HREF[insight.type]

            return (
              <div
                key={insight.id}
                className={[
                  'rounded-xl border bg-lz-surface px-5 py-4',
                  insight.resolved
                    ? 'border-lz-border opacity-60'
                    : insight.priority === 'critical'
                    ? 'border-lz-danger/30'
                    : insight.priority === 'high'
                    ? 'border-lz-warning/30'
                    : 'border-lz-border',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Header */}
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={PRIORITY_VARIANT[insight.priority]}>
                        {PRIORITY_LABEL[insight.priority]}
                      </Badge>
                      <Badge variant="neutral">{TYPE_LABEL[insight.type] ?? insight.type}</Badge>
                      {insight.resolved && <Badge variant="success">Resuelta</Badge>}
                    </div>
                    <p className="text-sm font-semibold text-lz-text">{insight.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-lz-muted">{insight.description}</p>
                    <p className="mt-2 text-[10px] text-lz-muted/60">
                      {new Date(insight.created_at).toLocaleString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {!insight.resolved && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {actionHref && (
                        <a
                          href={actionHref}
                          className="inline-flex h-8 items-center rounded-lg border border-lz-border px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
                        >
                          Ver módulo
                        </a>
                      )}
                      <form action={dismiss}>
                        <button
                          type="submit"
                          className="h-8 rounded-lg border border-lz-success/30 bg-lz-success/10 px-3 text-xs font-medium text-lz-success transition-colors hover:bg-lz-success/20"
                        >
                          Resolver
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
