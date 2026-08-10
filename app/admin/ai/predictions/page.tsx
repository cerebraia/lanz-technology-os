import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getInventoryPredictions } from '@/features/ai/data/inventory-predictions'
import { RISK_COLORS, RISK_BG } from '@/features/ai/data/constants'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { Card }        from '@/components/ui/card'
import { IconBox }     from '@/components/icons'

export const metadata: Metadata = { title: 'Predicciones de inventario' }

const RISK_LABELS = { normal: 'Normal', attention: 'Atención', critical: 'Crítico' } as const

export default async function PredictionsPage() {
  await verifySession()
  const canRead = await checkPermission('ai.read')
  if (!canRead) redirect('/admin/ai')

  const predictions = await getInventoryPredictions()

  const critical  = predictions.filter((p) => p.risk === 'critical')
  const attention = predictions.filter((p) => p.risk === 'attention')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Predicciones de inventario"
        description="Estimación de agotamiento basada en la velocidad de ventas de los últimos 30 días."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'IA',        href: '/admin/ai' },
          { label: 'Predicciones' },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            {critical.length > 0  && <Badge variant="danger">{critical.length} crítico{critical.length > 1 ? 's' : ''}</Badge>}
            {attention.length > 0 && <Badge variant="warning">{attention.length} atención</Badge>}
          </div>
        }
      />

      {predictions.length === 0 ? (
        <EmptyState
          icon={<IconBox size={22} className="text-lz-muted" />}
          title="Sin predicciones que mostrar"
          description="Todos los productos con ventas recientes tienen stock suficiente."
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Stock crítico',    count: critical.length,  color: 'text-lz-danger',  desc: '≤ 7 días' },
              { label: 'Requiere atención', count: attention.length, color: 'text-lz-warning', desc: '8–21 días' },
              { label: 'Total alertados',  count: predictions.length, color: 'text-lz-text',  desc: 'productos' },
            ].map(({ label, count, color, desc }) => (
              <Card key={label} className="text-center">
                <p className={['text-2xl font-bold tabular-nums', color].join(' ')}>{count}</p>
                <p className="text-xs font-semibold text-lz-text">{label}</p>
                <p className="text-[11px] text-lz-muted">{desc}</p>
              </Card>
            ))}
          </div>

          {/* Predictions table */}
          <div className="overflow-hidden rounded-xl border border-lz-border">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Vtas. / día</th>
                  <th className="px-4 py-3 text-right font-medium">Días restantes</th>
                  <th className="px-4 py-3 text-right font-medium hidden md:table-cell">Agotamiento</th>
                  <th className="px-4 py-3 text-center font-medium">Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {predictions.map((p) => (
                  <tr key={p.productId} className="hover:bg-lz-surface/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-lz-text">{p.name}</p>
                      <p className="font-mono text-[11px] text-lz-muted">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">{p.onHand}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-lz-muted hidden sm:table-cell">
                      {p.avgDailySales > 0 ? p.avgDailySales.toFixed(2) : '—'}
                    </td>
                    <td className={['px-4 py-3 text-right tabular-nums text-sm font-semibold', RISK_COLORS[p.risk]].join(' ')}>
                      {p.daysRemaining === 0 ? 'Agotado' : p.daysRemaining !== null ? `${p.daysRemaining}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-lz-muted hidden md:table-cell">
                      {p.stockoutDate ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={['inline-flex h-2 w-2 rounded-full', RISK_BG[p.risk]].join(' ')} title={RISK_LABELS[p.risk]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
