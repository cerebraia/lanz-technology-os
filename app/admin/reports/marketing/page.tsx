import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getMarketingReport } from '@/features/reports/data/marketing-report'
import { fmtCurrency, fmtPct } from '@/features/reports/data/period'
import { KpiGrid }       from '@/features/reports/components/kpi-grid'
import { ReportSection } from '@/features/reports/components/report-section'
import { ExportCSV }     from '@/features/reports/components/export-csv'
import { PageHeader }    from '@/components/ui/page-header'
import { Badge }         from '@/components/ui/badge'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '@/features/marketing/data/constants'
import { COUPON_TYPE_LABELS } from '@/features/marketing/data/constants'

export const metadata: Metadata = { title: 'Reporte de marketing' }

export default async function MarketingReportPage() {
  await verifySession()
  const [canRead, canExport] = await Promise.all([
    checkPermission('reports.read'),
    checkPermission('reports.export'),
  ])
  if (!canRead) redirect('/admin/reports')

  const data = await getMarketingReport()

  const kpis = [
    { label: 'Campañas activas',     value: String(data.activeCampaigns),  color: 'success' as const },
    { label: 'Mensajes enviados',    value: String(data.totalSent),         color: 'default' as const },
    { label: 'Conversiones',         value: String(data.converted),         color: data.converted > 0 ? 'success' as const : 'muted' as const },
    { label: 'Tasa de conversión',   value: fmtPct(data.conversionRate),   color: data.conversionRate > 0 ? 'success' as const : 'muted' as const },
    { label: 'Inversión total',      value: fmtCurrency(data.totalBudget), color: 'default' as const },
    { label: 'Cupones activos',      value: String(data.activeCoupons),    color: 'info'    as const },
    { label: 'Usos de cupones',      value: String(data.totalCouponUses),  color: 'default' as const },
  ]

  const exportRows = data.campaignRows.map((c) => ({
    Campaña:     c.name,
    Tipo:        CAMPAIGN_TYPE_LABELS[c.type]?.label ?? c.type,
    Estado:      CAMPAIGN_STATUS_LABELS[c.status]?.label ?? c.status,
    Enviados:    c.sent,
    Convertidos: c.converted,
    'Conversión %': c.convRate.toFixed(1),
    'Presupuesto USD': c.budget?.toFixed(2) ?? '',
  }))

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Reporte de marketing"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Reportes',  href: '/admin/reports' },
          { label: 'Marketing' },
        ]}
        actions={canExport ? <ExportCSV filename="marketing" rows={exportRows} /> : undefined}
      />

      <KpiGrid items={kpis} cols={4} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaigns table */}
        <ReportSection title="Rendimiento por campaña">
          <div className="overflow-hidden rounded-xl border border-lz-border">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Campaña</th>
                  <th className="px-4 py-2.5 text-right font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Enviados</th>
                  <th className="px-4 py-2.5 text-right font-medium">Conv. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border/50">
                {data.campaignRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-lz-muted">Sin campañas.</td></tr>
                ) : (
                  data.campaignRows.map((c) => {
                    const s = CAMPAIGN_STATUS_LABELS[c.status]
                    const t = CAMPAIGN_TYPE_LABELS[c.type]
                    return (
                      <tr key={c.id} className="hover:bg-lz-surface/60">
                        <td className="px-4 py-2.5">
                          <p className="text-sm text-lz-text">{c.name}</p>
                          <span className="text-[11px] font-medium" style={{ color: t?.color ?? '#888' }}>{t?.label ?? c.type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? c.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-xs">{c.sent}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-xs font-semibold text-lz-success">
                          {fmtPct(c.convRate)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </ReportSection>

        {/* Top coupons */}
        <ReportSection title="Cupones más usados">
          {data.topCoupons.length === 0 ? (
            <p className="text-sm text-lz-muted">Sin cupones registrados.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-lz-border">
              <table className="w-full text-sm">
                <thead className="border-b border-lz-border bg-lz-surface text-xs text-lz-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Código</th>
                    <th className="px-4 py-2.5 text-right font-medium">Descuento</th>
                    <th className="px-4 py-2.5 text-right font-medium">Usos</th>
                    <th className="px-4 py-2.5 text-right font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border/50">
                  {data.topCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-lz-surface/60">
                      <td className="px-4 py-2.5 font-mono text-sm font-bold text-lz-text">{c.code}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                        {c.type === 'percentage' ? `${c.value}%` : `USD ${c.value.toFixed(2)}`}
                        <p className="text-[10px] text-lz-muted">{COUPON_TYPE_LABELS[c.type]}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm font-semibold">{c.used_count}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={c.is_active ? 'success' : 'neutral'}>
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportSection>
      </div>
    </div>
  )
}
