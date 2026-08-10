import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getInventoryReport } from '@/features/reports/data/inventory'
import { fmtCurrency } from '@/features/reports/data/period'
import { KpiGrid }       from '@/features/reports/components/kpi-grid'
import { ReportSection } from '@/features/reports/components/report-section'
import { ExportCSV }     from '@/features/reports/components/export-csv'
import { PageHeader }    from '@/components/ui/page-header'
import { Badge }         from '@/components/ui/badge'
import { EmptyState }    from '@/components/ui/empty-state'
import { IconBox }       from '@/components/icons'

export const metadata: Metadata = { title: 'Reporte de inventario' }

function StockTable({ rows, emptyMsg }: {
  rows: { name: string; sku: string; on_hand: number; available: number; value: number }[]
  emptyMsg: string
}) {
  if (rows.length === 0) return <p className="text-sm text-lz-muted">{emptyMsg}</p>
  return (
    <div className="overflow-hidden rounded-xl border border-lz-border">
      <table className="w-full text-sm">
        <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Producto</th>
            <th className="px-4 py-2.5 text-right font-medium">Stock</th>
            <th className="px-4 py-2.5 text-right font-medium hidden sm:table-cell">Disponible</th>
            <th className="px-4 py-2.5 text-right font-medium hidden md:table-cell">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lz-border/50">
          {rows.map((r) => (
            <tr key={r.sku} className="hover:bg-lz-surface/60">
              <td className="px-4 py-2.5">
                <p className="text-sm text-lz-text">{r.name}</p>
                <p className="font-mono text-[11px] text-lz-muted">{r.sku}</p>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold">
                <span className={r.on_hand === 0 ? 'text-lz-danger' : 'text-lz-text'}>{r.on_hand}</span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-sm text-lz-muted hidden sm:table-cell">{r.available}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-lz-muted hidden md:table-cell">{fmtCurrency(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function InventoryReportPage() {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.inventory.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const data = await getInventoryReport()

  const kpis = [
    { label: 'Total productos',      value: String(data.totalProducts),          color: 'default' as const },
    { label: 'Valor inventario',     value: fmtCurrency(data.totalValue),         color: 'success' as const },
    { label: 'Sin stock',            value: String(data.outOfStockCount),         color: data.outOfStockCount > 0 ? 'danger' as const : 'muted' as const },
    { label: 'Bajo stock',           value: String(data.lowStockCount),           color: data.lowStockCount > 0 ? 'warning' as const : 'muted' as const },
    { label: 'Cobertura promedio',   value: data.avgCoverage > 0 ? `${data.avgCoverage.toFixed(0)} días` : '—', color: 'default' as const },
    { label: 'Sin movimiento',       value: String(data.noMovement.length),       color: 'muted' as const },
  ]

  const exportRows = data.allRows.map((r) => ({
    Producto:   r.name,
    SKU:        r.sku,
    Stock:      r.on_hand,
    Reservado:  r.reserved,
    Disponible: r.available,
    'Valor USD': r.value.toFixed(2),
    'Ventas 30d': r.sales30,
    'Cobertura días': r.coverage?.toFixed(0) ?? '',
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte de inventario"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Inventario' },
        ]}
        actions={canExport ? <ExportCSV filename="inventario" rows={exportRows} /> : undefined}
      />

      <KpiGrid items={kpis} cols={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReportSection title="Productos agotados" subtitle="Sin stock disponible"
          actions={<Badge variant="danger">{data.outOfStockCount}</Badge>}>
          <StockTable rows={data.outOfStock.slice(0,10)} emptyMsg="Sin productos agotados. ✓" />
        </ReportSection>

        <ReportSection title="Bajo stock" subtitle="En o por debajo del mínimo"
          actions={<Badge variant="warning">{data.lowStockCount}</Badge>}>
          <StockTable rows={data.lowStock.slice(0,10)} emptyMsg="Sin productos con bajo stock. ✓" />
        </ReportSection>

        <ReportSection title="Alta rotación" subtitle="Más vendidos en 30 días">
          {data.highRotation.length === 0 ? (
            <EmptyState icon={<IconBox size={20} className="text-lz-muted" />} title="Sin movimientos" description="No hay ventas registradas en los últimos 30 días." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Producto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ventas 30d</th>
                    <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {data.highRotation.map((r) => (
                    <tr key={r.sku} className="hover:bg-lz-surface/60">
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-lz-text">{r.name}</p>
                        <p className="font-mono text-[11px] text-lz-muted">{r.sku}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold text-lz-success">{r.sales30}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm text-lz-muted">{r.on_hand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>

        <ReportSection title="Sin movimiento" subtitle="Con stock pero sin ventas en 30 días">
          <StockTable rows={data.noMovement} emptyMsg="Todos los productos tuvieron movimiento. ✓" />
        </ReportSection>
      </div>
    </div>
  )
}
