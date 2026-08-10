import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconClipboard } from '@/components/icons'

export const metadata: Metadata = { title: 'Registro de actividad' }

type AuditLog = {
  id:          string
  actor_id:    string | null
  action:      text
  entity_type: string
  entity_id:   string | null
  metadata:    Record<string, unknown> | null
  created_at:  string
  profiles:    { full_name: string } | null
}

type Props = { searchParams: Promise<{ entity?: string; action?: string }> }

const ENTITY_LABELS: Record<string, string> = {
  product:            'Producto',
  category:           'Categoría',
  order:              'Pedido',
  customer:           'Cliente',
  inventory_entry:    'Entrada inventario',
  inventory_adjustment: 'Ajuste inventario',
  purchase_order:     'Orden de compra',
  import:             'Importación',
  financial_transaction: 'Transacción',
  business_settings:  'Configuración',
  automation:         'Automatización',
  supplier:           'Proveedor',
}

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  created:   'success',
  updated:   'neutral',
  deleted:   'danger',
  published: 'success',
  archived:  'warning',
  cancelled: 'danger',
  confirmed: 'success',
  shipped:   'neutral',
  delivered: 'success',
}

type text = string

async function getAuditLogs(entityFilter?: string, actionFilter?: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (entityFilter) q = q.eq('entity_type', entityFilter)
  if (actionFilter) q = q.eq('action', actionFilter)

  const { data } = await q
  return (data ?? []) as AuditLog[]
}

export default async function ActivityPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('audit.read')
  if (!canRead) redirect('/admin')

  const sp    = await searchParams
  const logs  = await getAuditLogs(sp.entity, sp.action)

  const entityTypes = Object.keys(ENTITY_LABELS)

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Registro de actividad"
        description="Historial inmutable de operaciones realizadas en el sistema."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Actividad' },
        ]}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <a
          href="?"
          className={[
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            !sp.entity && !sp.action
              ? 'border-lz-primary bg-lz-primary/10 text-lz-primary'
              : 'border-lz-border text-lz-muted hover:text-lz-text',
          ].join(' ')}
        >
          Todo
        </a>
        {entityTypes.map(et => (
          <a
            key={et}
            href={`?entity=${et}`}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              sp.entity === et
                ? 'border-lz-primary bg-lz-primary/10 text-lz-primary'
                : 'border-lz-border text-lz-muted hover:text-lz-text',
            ].join(' ')}
          >
            {ENTITY_LABELS[et]}
          </a>
        ))}
      </div>

      {/* Log table */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">
            {logs.length} registro{logs.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        {logs.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<IconClipboard size={20} className="text-lz-muted" />}
              title="Sin actividad registrada"
              description="Las operaciones del sistema aparecerán aquí. Los registros son inmutables."
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['Fecha', 'Usuario', 'Acción', 'Módulo', 'Entidad'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3 text-xs text-lz-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-lz-text">
                        {log.profiles?.full_name ?? 'Sistema'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTION_VARIANT[log.action] ?? 'neutral'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-lz-muted">
                        {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-lz-muted">
                      {log.entity_id?.slice(0, 8) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-lz-muted">
        Los registros son inmutables. Los errores se corrigen con operaciones compensatorias.
      </p>
    </div>
  )
}
