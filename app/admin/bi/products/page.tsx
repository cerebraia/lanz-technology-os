import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import {
  getProductProfitability,
  type SortKey,
} from '@/features/bi/data/product-profitability'
import { fmtCurrency, fmtPct } from '@/features/reports/data/period'
import { ExportCSV }   from '@/features/reports/components/export-csv'
import { PageHeader }  from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }       from '@/components/ui/badge'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconBox }     from '@/components/icons'

export const metadata: Metadata = { title: 'Rentabilidad por producto' }

type Props = { searchParams: Promise<{ period?: string; sort?: string }> }

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'ganancia',    label: 'Mayor ganancia' },
  { value: 'margen',      label: 'Mayor margen %' },
  { value: 'volumen',     label: 'Mayor volumen' },
  { value: 'rendimiento', label: 'Menor rendimiento' },
]

const PERIOD_OPTS = [
  { value: 'month', label: 'Este mes' },
  { value: 'year',  label: 'Este año' },
]

function MarginBadge({ margin }: { margin: number }) {
  if (isNaN(margin)) return <Badge variant="muted">Sin costo</Badge>
  if (margin >= 30) return <Badge variant="success">{fmtPct(margin)}</Badge>
  if (margin >= 10) return <Badge variant="neutral">{fmtPct(margin)}</Badge>
  return <Badge variant="danger">{fmtPct(margin)}</Badge>
}

export default async function ProductProfitabilityPage({ searchParams }: Props) {
  await verifySession()
  const canRead = await checkPermission('reports.sales.read')
  if (!canRead) redirect('/admin/bi')

  const sp     = await searchParams
  const period = sp.period ?? 'month'
  const sort   = (sp.sort ?? 'ganancia') as SortKey

  const rows = await getProductProfitability(period, sort, 50).catch(() => [])

  const totalRevenue    = rows.reduce((a, r) => a + r.revenue, 0)
  const totalGrossProfit = rows.filter(r => r.hasCostData).reduce((a, r) => a + r.grossProfit, 0)
  const avgMargin = rows.filter(r => r.hasCostData && !isNaN(r.margin)).length > 0
    ? rows.filter(r => r.hasCostData && !isNaN(r.margin)).reduce((a, r) => a + r.margin, 0)
      / rows.filter(r => r.hasCostData && !isNaN(r.margin)).length
    : NaN

  const exportRows = rows.map(r => ({
    SKU:           r.productSku,
    Producto:      r.productName,
    Categoría:     r.category,
    'Unidades vendidas': r.unitsSold,
    Ingresos:      r.revenue.toFixed(2),
    'Costo total': r.hasCostData ? r.totalCost.toFixed(2) : '—',
    'Ganancia bruta': r.hasCostData ? r.grossProfit.toFixed(2) : '—',
    'Margen %':    r.hasCostData && !isNaN(r.margin) ? r.margin.toFixed(1) : '—',
    'Precio promedio': r.avgPrice.toFixed(2),
    'Costo promedio':  r.hasCostData ? r.avgCost.toFixed(2) : '—',
  }))

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Rentabilidad por producto"
        description="Margen, costo y utilidad bruta por SKU."
        breadcrumbs={[
          { label: 'Dashboard',    href: '/admin' },
          { label: 'Inteligencia', href: '/admin/bi' },
          { label: 'Rentabilidad' },
        ]}
        actions={<ExportCSV filename={`rentabilidad-${period}`} rows={exportRows} />}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Productos',    value: String(rows.length) },
          { label: 'Ingresos',     value: fmtCurrency(totalRevenue) },
          { label: 'Ganancia bruta', value: fmtCurrency(totalGrossProfit) },
          { label: 'Margen promedio', value: isNaN(avgMargin) ? '—' : fmtPct(avgMargin) },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-lz-border bg-lz-surface p-4">
            <p className="text-xs text-lz-muted">{kpi.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-lz-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-lz-border bg-lz-surface p-1">
          {PERIOD_OPTS.map(p => (
            <Link
              key={p.value}
              href={`?period=${p.value}&sort=${sort}`}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                period === p.value ? 'bg-lz-primary text-white' : 'text-lz-muted hover:text-lz-text',
              ].join(' ')}
            >
              {p.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl border border-lz-border bg-lz-surface p-1">
          {SORT_OPTIONS.map(s => (
            <Link
              key={s.value}
              href={`?period=${period}&sort=${s.value}`}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                sort === s.value ? 'bg-lz-primary text-white' : 'text-lz-muted hover:text-lz-text',
              ].join(' ')}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Note about cost data */}
      {rows.some(r => !r.hasCostData) && (
        <p className="text-xs text-lz-muted">
          * Los productos sin costo de referencia en el historial de pedidos muestran &ldquo;Sin costo&rdquo; y se excluyen del margen promedio.
        </p>
      )}

      {/* Table */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">{rows.length} producto{rows.length !== 1 ? 's' : ''}</p>
        </CardHeader>
        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<IconBox size={20} className="text-lz-muted" />}
              title="Sin datos de ventas"
              description="Registra pedidos con costo de referencia para ver la rentabilidad."
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['#', 'Producto', 'Categoría', 'Unid.', 'Ingresos', 'Costo', 'Ganancia', 'Margen'].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-medium ${h === 'Producto' || h === 'Categoría' || h === '#' ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {rows.map((r, i) => (
                  <tr key={r.productSku} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3 text-right text-xs text-lz-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-lz-text">{r.productName}</p>
                      <p className="font-mono text-[10px] text-lz-muted">{r.productSku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-lz-muted">{r.category}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">{r.unitsSold}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtCurrency(r.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-lz-muted">
                      {r.hasCostData ? fmtCurrency(r.totalCost) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={r.grossProfit >= 0 ? 'text-lz-success' : 'text-lz-danger'}>
                        {r.hasCostData ? fmtCurrency(r.grossProfit) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MarginBadge margin={r.margin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
