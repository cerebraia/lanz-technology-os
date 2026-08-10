import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getPurchaseRecommendations } from '@/features/ai/data/purchase-recommendations'
import { getProfitabilityAnalysis }   from '@/features/ai/data/profitability-analysis'
import { ConfidenceBar }  from '@/features/ai/components/confidence-bar'
import { PageHeader }     from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { EmptyState }     from '@/components/ui/empty-state'
import { IconBox } from '@/components/icons'

export const metadata: Metadata = { title: 'Recomendaciones IA' }

export default async function RecommendationsPage() {
  await verifySession()
  const canRead = await checkPermission('ai.recommendations')
  if (!canRead) redirect('/admin/ai')

  const [recs, profitability] = await Promise.all([
    getPurchaseRecommendations(),
    getProfitabilityAnalysis(),
  ])

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Recomendaciones"
        description="Sugerencias de compra y análisis de rentabilidad generados automáticamente."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'IA',        href: '/admin/ai' },
          { label: 'Recomendaciones' },
        ]}
      />

      {/* Purchase recommendations */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">Recomendaciones de compra</p>
          <p className="text-xs text-lz-muted">{recs.length} producto{recs.length !== 1 ? 's' : ''}</p>
        </CardHeader>
        <CardBody>
          {recs.length === 0 ? (
            <EmptyState
              icon={<IconBox size={20} className="text-lz-muted" />}
              title="Sin recomendaciones urgentes"
              description="Todos los productos están por encima de su punto de reorden."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border text-xs text-lz-muted">
                  <tr>
                    <th className="pb-2 text-left font-medium">Producto</th>
                    <th className="pb-2 text-right font-medium">Stock</th>
                    <th className="pb-2 text-right font-medium hidden sm:table-cell">Cantidad sugerida</th>
                    <th className="pb-2 text-right font-medium hidden md:table-cell">Costo est.</th>
                    <th className="pb-2 text-center font-medium">Confianza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {recs.map((r) => (
                    <tr key={r.productId} className="hover:bg-lz-surface/60">
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-lz-text">{r.name}</p>
                        <p className="text-[11px] text-lz-muted">{r.reason}</p>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-sm">
                        <span className={r.currentStock === 0 ? 'text-lz-danger font-semibold' : 'text-lz-text'}>
                          {r.currentStock}
                        </span>
                        <p className="text-[11px] text-lz-muted">mín: {r.reorderPoint}</p>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-sm font-semibold text-lz-accent hidden sm:table-cell">
                        {r.reorderQuantity} uds.
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-xs text-lz-muted hidden md:table-cell">
                        {r.estimatedCost !== null ? `USD ${r.estimatedCost.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 flex justify-center items-center">
                        <ConfidenceBar value={r.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Profitability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Top 10 productos más rentables</p>
            <p className="text-xs text-lz-muted">Últimos 30 días</p>
          </CardHeader>
          <CardBody>
            {profitability.top10.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin ventas en los últimos 30 días.</p>
            ) : (
              <ul className="divide-y divide-lz-border/50">
                {profitability.top10.map((p, i) => (
                  <li key={p.productId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-lz-muted w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm text-lz-text">{p.name}</p>
                        <p className="text-[11px] text-lz-muted">{p.unitsSold} uds. · Margen {p.margin.toFixed(1)}%</p>
                      </div>
                    </div>
                    <span className="tabular-nums text-sm font-semibold text-lz-success">USD {p.profit.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Top 10 categorías más rentables</p>
            <p className="text-xs text-lz-muted">Últimos 30 días · Margen promedio: {profitability.avgMargin.toFixed(1)}%</p>
          </CardHeader>
          <CardBody>
            {profitability.topCategories.length === 0 ? (
              <p className="text-sm text-lz-muted">Sin datos de ventas por categoría.</p>
            ) : (
              <div className="space-y-3">
                {profitability.topCategories.map((c) => (
                  <div key={c.categoryName}>
                    <div className="flex justify-between text-xs">
                      <span className="text-lz-text">{c.categoryName}</span>
                      <span className="tabular-nums text-lz-muted">USD {c.profit.toFixed(2)} · {c.margin.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lz-border">
                      <div
                        className={['h-full rounded-full', c.margin >= 0 ? 'bg-lz-success' : 'bg-lz-danger'].join(' ')}
                        style={{ width: `${Math.min(Math.abs(c.margin), 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom 10 */}
      {profitability.bottom10.length > 0 && (
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Productos con menor margen</p>
            <p className="text-xs text-lz-muted">Considera revisar precios o reducir costos</p>
          </CardHeader>
          <CardBody>
            <ul className="divide-y divide-lz-border/50">
              {profitability.bottom10.map((p) => (
                <li key={p.productId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-lz-text">{p.name}</p>
                    <p className="font-mono text-[11px] text-lz-muted">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={['text-sm font-semibold tabular-nums', p.margin < 0 ? 'text-lz-danger' : 'text-lz-warning'].join(' ')}>
                      {p.margin.toFixed(1)}%
                    </p>
                    <p className="text-[11px] text-lz-muted">USD {p.profit.toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
