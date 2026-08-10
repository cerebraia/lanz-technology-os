import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSegments, getSegmentCustomerCounts } from '@/features/marketing/data/segments'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { IconUsers }  from '@/components/icons'

export const metadata: Metadata = { title: 'Segmentos' }

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-lz-border">
      <div className="h-full rounded-full bg-lz-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default async function SegmentsPage() {
  await verifySession()
  const canRead = await checkPermission('marketing.read')
  if (!canRead) redirect('/admin/marketing')

  const [segments, counts] = await Promise.all([
    getSegments(),
    getSegmentCustomerCounts(),
  ])

  const maxCount = Math.max(...Object.values(counts), 1)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Segmentos de clientes"
        description="Grupos dinámicos para targeting de campañas."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'Segmentos' },
        ]}
      />

      {segments.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={22} className="text-lz-muted" />}
          title="Sin segmentos"
          description="Los segmentos se crean automáticamente con los datos de clientes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => {
            const count = counts[seg.name] ?? 0
            return (
              <Card key={seg.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-lz-text">{seg.name}</p>
                    {seg.description && (
                      <p className="mt-0.5 text-xs text-lz-muted">{seg.description}</p>
                    )}
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lz-primary/15 text-lz-accent">
                    <IconUsers size={16} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold tabular-nums text-lz-text">{count}</p>
                <p className="text-xs text-lz-muted">clientes en este segmento</p>
                <ProgressBar value={count} max={maxCount} />
              </Card>
            )
          })}
        </div>
      )}

      <Card padding={false}>
        <CardHeader><p className="text-sm font-semibold text-lz-text">Nota sobre segmentos</p></CardHeader>
        <CardBody>
          <p className="text-sm text-lz-muted">
            Los segmentos se calculan en tiempo real a partir de los datos de clientes, etiquetas y pedidos.
            Los conteos se actualizan cada vez que se recarga esta página.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
