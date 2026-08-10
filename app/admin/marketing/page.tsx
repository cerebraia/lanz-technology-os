import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getDashboardStats, getCampaigns }   from '@/features/marketing/data/campaigns'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS, AUTOMATION_DEFINITIONS } from '@/features/marketing/data/constants'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard }   from '@/components/ui/stat-card'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }      from '@/components/ui/badge'
import { IconMegaphone, IconPlus, IconDollar, IconUsers } from '@/components/icons'

export const metadata: Metadata = { title: 'Marketing' }

async function MarketingDashboard() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getCampaigns('active').then((c) => c.slice(0, 5)),
  ])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Campañas activas"   value={String(stats.active)}         icon={<IconMegaphone size={18} />} />
        <StatCard label="Total campañas"     value={String(stats.totalCampaigns)} icon={<IconMegaphone size={18} />} />
        <StatCard label="Clientes alcanzados" value={String(stats.reached)}       icon={<IconUsers size={18} />} />
        <StatCard label="Conversiones"       value={String(stats.converted)}      icon={<IconUsers size={18} />} />
        <StatCard label="Inversión total"    value={`USD ${stats.totalBudget.toFixed(2)}`} icon={<IconDollar size={18} />} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Campañas',   href: '/admin/marketing/campaigns'  },
          { label: 'Segmentos',  href: '/admin/marketing/segments'   },
          { label: 'Cupones',    href: '/admin/marketing/coupons'    },
          { label: 'Analíticas', href: '/admin/marketing/analytics'  },
        ].map(({ label, href }) => (
          <Link key={href} href={href}
            className="flex items-center justify-center rounded-xl border border-lz-border bg-lz-surface px-4 py-3 text-sm font-medium text-lz-text transition-colors hover:border-lz-primary/40 hover:text-lz-accent"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Active campaigns */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Campañas activas</p>
          <Link href="/admin/marketing/campaigns" className="text-xs text-lz-accent hover:underline">Ver todas</Link>
        </CardHeader>
        <CardBody>
          {recent.length === 0 ? (
            <p className="text-sm text-lz-muted">No hay campañas activas.</p>
          ) : (
            <ul className="divide-y divide-lz-border/50">
              {recent.map((c) => {
                const s = CAMPAIGN_STATUS_LABELS[c.status]
                const t = CAMPAIGN_TYPE_LABELS[c.type]
                return (
                  <li key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-lz-text">{c.name}</p>
                      <span className="text-xs font-medium" style={{ color: t?.color ?? '#888' }}>{t?.label ?? c.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.budget !== null && (
                        <span className="tabular-nums text-xs text-lz-muted">USD {c.budget.toFixed(2)}</span>
                      )}
                      <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? c.status}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Automations preview */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Automatizaciones disponibles</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUTOMATION_DEFINITIONS.map((a) => (
              <div key={a.id} className="rounded-lg border border-lz-border bg-lz-surface/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-lz-text">{a.name}</p>
                    <p className="mt-0.5 text-xs text-lz-muted">{a.description}</p>
                    <p className="mt-1 text-[11px] font-medium text-lz-accent">Trigger: {a.trigger}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default async function MarketingPage() {
  await verifySession()
  const canRead   = await checkPermission('marketing.read')
  if (!canRead) redirect('/admin')
  const canCreate = await checkPermission('marketing.create')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Marketing"
        description="Campañas, segmentación, cupones y fidelización de clientes."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Marketing' }]}
        actions={canCreate ? (
          <Link href="/admin/marketing/campaigns/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lz-primary px-3 text-xs font-medium text-white transition-colors hover:bg-lz-primary-hover"
          >
            <IconPlus size={14} /> Nueva campaña
          </Link>
        ) : undefined}
      />
      <Suspense fallback={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <StatCard key={i} label="" value="" loading />)}
        </div>
      }>
        <MarketingDashboard />
      </Suspense>
    </div>
  )
}
