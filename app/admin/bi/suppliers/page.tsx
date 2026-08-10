import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSupplierAnalysis } from '@/features/bi/data/supplier-analysis'
import { fmtCurrency }         from '@/features/reports/data/period'
import { ExportCSV }    from '@/features/reports/components/export-csv'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { EmptyState }   from '@/components/ui/empty-state'
import { BarChart }     from '@/components/ui/bar-chart'
import { IconClipboard } from '@/components/icons'

export const metadata: Metadata = { title: 'Análisis de proveedores' }

export default async function SuppliersPage() {
  await verifySession()
  const canRead = await checkPermission('reports.sales.read')
  if (!canRead) redirect('/admin/bi')

  const suppliers = await getSupplierAnalysis().catch(() => [])

  const totalInvested = suppliers.reduce((a, s) => a + s.totalInvested, 0)
  const totalOrders   = suppliers.reduce((a, s) => a + s.orderCount, 0)

  const chartData = suppliers.slice(0, 6).map(s => ({
    label: s.supplierName.slice(0, 12),
    value: s.totalInvested,
    color: 'primary' as const,
  }))

  const exportRows = suppliers.map(s => ({
    Proveedor:          s.supplierName,
    'Órdenes':          s.orderCount,
    'Total invertido':  s.totalInvested.toFixed(2),
    'Valor prom. orden': s.avgOrderValue.toFixed(2),
    'Unidades compradas': s.unitsBought,
    'Productos distintos': s.productCount,
    'Último pedido':    s.lastOrderDate?.slice(0, 10) ?? '—',
  }))

  return (
    <div className="animate-page space-y-6">
      <PageHeader
        title="Análisis de proveedores"
        description="Volumen de compra, inversión y rendimiento por proveedor."
        breadcrumbs={[
          { label: 'Dashboard',    href: '/admin' },
          { label: 'Inteligencia', href: '/admin/bi' },
          { label: 'Proveedores' },
        ]}
        actions={<ExportCSV filename="analisis-proveedores" rows={exportRows} />}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Proveedores',   value: String(suppliers.length) },
          { label: 'Total invertido', value: fmtCurrency(totalInvested) },
          { label: 'Órdenes totales', value: String(totalOrders) },
          { label: 'Valor prom. orden', value: totalOrders > 0 ? fmtCurrency(totalInvested / totalOrders) : '—' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-lz-border bg-lz-surface p-4">
            <p className="text-xs text-lz-muted">{kpi.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-lz-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Inversión por proveedor (top 6)</p>
          </CardHeader>
          <CardBody>
            <BarChart data={chartData} />
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card padding={false}>
        <CardHeader>
          <p className="text-sm font-semibold text-lz-text">{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''}</p>
        </CardHeader>
        {suppliers.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<IconClipboard size={20} className="text-lz-muted" />}
              title="Sin órdenes de compra"
              description="Crea órdenes de compra para ver el análisis de proveedores."
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border text-xs text-lz-muted">
                <tr>
                  {['Proveedor', 'Órdenes', 'Unidades', 'Productos', 'Valor prom.', 'Total invertido', 'Último pedido'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${h === 'Proveedor' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {suppliers.map((s, i) => (
                  <tr key={s.supplierName} className="hover:bg-lz-surface/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lz-primary/15 text-[10px] font-bold text-lz-primary">
                          {i + 1}
                        </span>
                        <span className="font-medium text-lz-text">{s.supplierName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">{s.orderCount}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">{s.unitsBought}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">{s.productCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">{fmtCurrency(s.avgOrderValue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtCurrency(s.totalInvested)}</td>
                    <td className="px-4 py-3 text-right text-xs text-lz-muted">
                      {s.lastOrderDate
                        ? new Date(s.lastOrderDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
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
