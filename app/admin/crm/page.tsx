import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getDashboardStats } from '@/features/crm/data/customers'
import { getQuotes }         from '@/features/crm/data/quotes'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard }   from '@/components/ui/stat-card'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }      from '@/components/ui/badge'
import { IconUsers, IconPlus } from '@/components/icons'
import { QUOTE_STATUS_LABELS } from '@/features/crm/data/constants'

export const metadata: Metadata = { title: 'CRM' }

async function CrmDashboard() {
  const [stats, recentQuotes] = await Promise.all([
    getDashboardStats(),
    getQuotes().then((q) => q.slice(0, 5)),
  ])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Clientes activos"  value={String(stats.active)}       icon={<IconUsers size={18} />} />
        <StatCard label="Nuevos este mes"   value={String(stats.newThisMonth)} icon={<IconUsers size={18} />} />
        <StatCard label="Clientes VIP"      value={String(stats.vip)}          icon={<IconUsers size={18} />} />
        <StatCard label="Total registrados" value={String(stats.total)}        icon={<IconUsers size={18} />} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: 'Clientes',     href: '/admin/crm/customers' },
          { label: 'Cotizaciones', href: '/admin/crm/quotes'    },
          { label: 'Etiquetas',    href: '/admin/crm/tags'      },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-center rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm font-medium text-lz-text transition-colors hover:border-lz-primary/40 hover:text-lz-accent"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Recent quotes */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Cotizaciones recientes</p>
          <Link href="/admin/crm/quotes" className="text-xs text-lz-accent hover:underline">Ver todas</Link>
        </CardHeader>
        <CardBody>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-lz-muted">Sin cotizaciones aún.</p>
          ) : (
            <ul className="divide-y divide-lz-border/50">
              {recentQuotes.map((q) => {
                const s = QUOTE_STATUS_LABELS[q.status]
                const name = q.customers
                  ? `${q.customers.first_name} ${q.customers.last_name ?? ''}`.trim()
                  : 'Sin cliente'
                return (
                  <li key={q.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm text-lz-text">{name}</p>
                      <p className="text-xs text-lz-muted">
                        {new Date(q.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-sm font-semibold text-lz-text">
                        USD {q.total.toFixed(2)}
                      </span>
                      <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? q.status}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default async function CrmPage() {
  await verifySession()
  const canRead = await checkPermission('crm.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('crm.create')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="CRM"
        description="Clientes, cotizaciones y relaciones comerciales de Lanz Technology."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'CRM' }]}
        actions={canCreate ? (
          <Link
            href="/admin/crm/customers/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nuevo cliente
          </Link>
        ) : undefined}
      />
      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}
        </div>
      }>
        <CrmDashboard />
      </Suspense>
    </div>
  )
}
