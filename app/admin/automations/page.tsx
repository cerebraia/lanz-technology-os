import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getAutomations, getDashboardStats, type Automation } from '@/features/automations/data/automations'
import { TRIGGER_LABELS, ACTION_LABELS } from '@/features/automations/data/constants'
import { ToggleButton }  from '@/features/automations/components/toggle-button'
import { PageHeader }    from '@/components/ui/page-header'
import { StatCard }      from '@/components/ui/stat-card'
import { Table }         from '@/components/ui/table'
import { EmptyState }    from '@/components/ui/empty-state'
import { IconPlus, IconSettings, IconUsers } from '@/components/icons'

export const metadata: Metadata = { title: 'Automatizaciones' }

async function AutomationStats() {
  const s = await getDashboardStats()
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total"        value={String(s.total)}     icon={<IconSettings size={18} />} />
      <StatCard label="Activas"      value={String(s.active)}    icon={<IconSettings size={18} />} />
      <StatCard label="Ejecuciones"  value={String(s.totalRuns)} icon={<IconUsers    size={18} />} />
      <StatCard label="Completadas (7d)" value={String(s.completed)} icon={<IconUsers size={18} />} />
      <StatCard label="Fallidas (7d)"    value={String(s.failed)}    icon={<IconUsers size={18} />} />
      <StatCard label="Pendientes"       value={String(s.pending)}   icon={<IconUsers size={18} />} />
    </div>
  )
}

export default async function AutomationsPage() {
  await verifySession()
  const canRead   = await checkPermission('automations.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('automations.create')
  const canUpdate = await checkPermission('automations.update')

  const automations = await getAutomations()

  const COLUMNS = [
    {
      key: 'name', header: 'Automatización',
      render: (row: Automation) => {
        const t = TRIGGER_LABELS[row.trigger_type]
        const a = ACTION_LABELS[row.action_type]
        return (
          <div>
            <Link href={`/admin/automations/${row.id}`} className="text-sm font-medium text-lz-text hover:text-lz-accent transition-colors">
              {row.name}
            </Link>
            {row.description && <p className="text-xs text-lz-muted mt-0.5 truncate max-w-xs">{row.description}</p>}
            <div className="mt-1 flex gap-2 text-[11px] text-lz-muted">
              <span>{t?.icon} {t?.label}</span>
              <span>→</span>
              <span>{a?.icon} {a?.label}</span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'run_count', header: 'Ejecuciones', className: 'text-right hidden sm:table-cell',
      render: (row: Automation) => (
        <span className="tabular-nums text-xs text-lz-muted">{row.run_count}</span>
      ),
    },
    {
      key: 'last_run_at', header: 'Última vez', className: 'hidden md:table-cell',
      render: (row: Automation) => (
        <span className="text-xs text-lz-muted">
          {row.last_run_at
            ? new Date(row.last_run_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'enabled', header: 'Estado',
      render: (row: Automation) => (
        <ToggleButton id={row.id} enabled={row.enabled} canUpdate={canUpdate} />
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Automatizaciones"
        description="Motor de reglas para ejecutar acciones sin intervención humana."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Automatizaciones' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/automations/history"
              className="inline-flex h-8 items-center rounded-lg border border-lz-border px-3 text-xs font-medium text-lz-muted hover:text-lz-text transition-colors"
            >
              Historial
            </Link>
            {canCreate && (
              <Link href="/admin/automations/new"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
              >
                <IconPlus size={14} /> Nueva
              </Link>
            )}
          </div>
        }
      />

      <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({length:6}).map((_,i)=><StatCard key={i} label="" value="" loading />)}</div>}>
        <AutomationStats />
      </Suspense>

      {automations.length === 0 ? (
        <EmptyState
          icon={<IconSettings size={22} className="text-lz-muted" />}
          title="Sin automatizaciones"
          description="Crea reglas para automatizar tareas repetitivas del negocio."
          action={canCreate ? (
            <Link href="/admin/automations/new" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover">
              <IconPlus size={14} /> Nueva automatización
            </Link>
          ) : undefined}
        />
      ) : (
        <Table columns={COLUMNS} rows={automations} keyExtractor={(r) => r.id} />
      )}
    </div>
  )
}
