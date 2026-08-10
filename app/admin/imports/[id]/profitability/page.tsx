import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getImportById } from '@/features/imports/data/imports'
import { computeProfitability, type ProductProfitLine } from '@/features/imports/data/profitability'
import { ProfitabilitySaveButton } from '@/features/imports/components/profitability-save-button'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconBar }     from '@/components/icons'

export const metadata: Metadata = { title: 'Rentabilidad de importación' }

type Props = { params: Promise<{ id: string }> }

function fmtUSD(v: number) {
  return `USD ${v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtPct(v: number) {
  return `${v.toFixed(2)}%`
}

function MarginBadge({ margin }: { margin: number }) {
  if (margin >= 30) return <Badge variant="success">{fmtPct(margin)}</Badge>
  if (margin >= 10) return <Badge variant="warning">{fmtPct(margin)}</Badge>
  return <Badge variant="danger">{fmtPct(margin)}</Badge>
}

const PRODUCT_COLUMNS = [
  {
    key:    'product',
    header: 'Producto',
    render: (row: ProductProfitLine) => (
      <div>
        <p className="text-sm font-medium text-lz-text">{row.product_name}</p>
        <p className="font-mono text-xs text-lz-muted">{row.sku}</p>
      </div>
    ),
  },
  {
    key:       'received_quantity',
    header:    'Unidades',
    className: 'text-right hidden sm:table-cell',
    render:    (row: ProductProfitLine) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.received_quantity}</span>
    ),
  },
  {
    key:       'final_unit_cost',
    header:    'Costo unit.',
    className: 'text-right hidden md:table-cell',
    render:    (row: ProductProfitLine) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.final_unit_cost.toFixed(2)}</span>
    ),
  },
  {
    key:       'sale_price',
    header:    'Precio venta',
    className: 'text-right hidden md:table-cell',
    render:    (row: ProductProfitLine) => (
      <span className="tabular-nums text-xs text-lz-muted">{row.sale_price.toFixed(2)}</span>
    ),
  },
  {
    key:    'revenue',
    header: 'Ingresos',
    className: 'text-right',
    render: (row: ProductProfitLine) => (
      <span className="tabular-nums text-sm text-lz-text">{fmtUSD(row.revenue)}</span>
    ),
  },
  {
    key:    'gross_profit',
    header: 'Ganancia',
    className: 'text-right',
    render: (row: ProductProfitLine) => (
      <span className={['tabular-nums text-sm font-medium', row.gross_profit >= 0 ? 'text-lz-success' : 'text-lz-danger'].join(' ')}>
        {row.gross_profit >= 0 ? '+' : ''}{fmtUSD(row.gross_profit)}
      </span>
    ),
  },
  {
    key:    'margin',
    header: 'Margen',
    render: (row: ProductProfitLine) => <MarginBadge margin={row.margin} />,
  },
]

export default async function ProfitabilityPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead = await checkPermission('imports.profitability.read')
  if (!canRead) redirect('/admin')

  const [imp, analysis] = await Promise.all([
    getImportById(id),
    computeProfitability(id),
  ])

  if (!imp) notFound()

  const hasData = analysis.products.length > 0

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Rentabilidad"
        description={`Importación ${imp.reference} · Análisis en tiempo real`}
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Importaciones', href: '/admin/imports' },
          { label: imp.reference,   href: `/admin/imports/${id}` },
          { label: 'Rentabilidad' },
        ]}
        actions={
          hasData ? <ProfitabilitySaveButton importId={id} /> : undefined
        }
      />

      {!analysis.has_allocation && hasData && (
        <Alert variant="info">
          Sin distribución de costos logísticos. Los cálculos actuales no incluyen flete, seguro ni aduana.{' '}
          <Link href={`/admin/imports/${id}/costs/new`} className="underline underline-offset-2 hover:text-lz-accent">
            Distribuir costos →
          </Link>
        </Alert>
      )}

      {!hasData ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<IconBar size={22} className="text-lz-muted" />}
              title="Sin datos suficientes"
              description="Esta importación no tiene recepciones confirmadas. Confirma una recepción para ver el análisis de rentabilidad."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Inversión total',
                value: fmtUSD(analysis.total_cost),
                sub:   analysis.has_allocation ? 'Incluye logística' : 'Solo mercancía',
                color: 'text-lz-text',
              },
              {
                label: 'Ingresos proyectados',
                value: fmtUSD(analysis.total_revenue),
                sub:   'Al precio de venta vigente',
                color: 'text-lz-text',
              },
              {
                label: 'Ganancia bruta',
                value: fmtUSD(analysis.gross_profit),
                sub:   fmtPct(analysis.margin) + ' de margen',
                color: analysis.gross_profit >= 0 ? 'text-lz-success' : 'text-lz-danger',
              },
              {
                label: 'ROI',
                value: fmtPct(analysis.roi),
                sub:   'Retorno sobre inversión',
                color: analysis.roi >= 0 ? 'text-lz-success' : 'text-lz-danger',
              },
            ].map(({ label, value, sub, color }) => (
              <Card key={label}>
                <p className={['text-xl font-semibold tracking-tight tabular-nums', color].join(' ')}>{value}</p>
                <p className="mt-0.5 text-xs font-medium text-lz-muted">{label}</p>
                {sub && <p className="mt-0.5 text-[11px] text-lz-muted/70">{sub}</p>}
              </Card>
            ))}
          </div>

          {/* Desglose de inversión */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { label: 'Costo de mercancía',  value: analysis.total_merchandise_cost },
              { label: 'Costo logístico',      value: analysis.total_logistics_cost   },
              { label: 'Costo total',          value: analysis.total_cost             },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center">
                <p className="text-lg font-semibold tabular-nums text-lz-text">{fmtUSD(value)}</p>
                <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
              </Card>
            ))}
          </div>

          {/* Tabla por producto */}
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Rentabilidad por producto</p>
                <p className="mt-0.5 text-xs text-lz-muted">
                  {analysis.products.length} productos · Precios de venta vigentes
                </p>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table
                columns={PRODUCT_COLUMNS}
                rows={analysis.products}
                keyExtractor={(r) => r.product_id}
              />
            </div>
          </Card>

          {/* Snapshots históricos */}
          {analysis.snapshots.length > 0 && (
            <Card padding={false}>
              <CardHeader>
                <div>
                  <p className="text-sm font-semibold text-lz-text">Snapshots guardados</p>
                  <p className="mt-0.5 text-xs text-lz-muted">Análisis históricos de esta importación</p>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-lz-border bg-lz-sidebar">
                    <tr>
                      <th className="px-4 py-2.5 text-left   text-xs font-semibold uppercase tracking-wide text-lz-muted">Fecha</th>
                      <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted">Costo total</th>
                      <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Ingresos</th>
                      <th className="px-4 py-2.5 text-right  text-xs font-semibold uppercase tracking-wide text-lz-muted">Ganancia</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted">Margen</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-lz-muted hidden md:table-cell">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.snapshots.map((snap) => (
                      <tr key={snap.id} className="border-b border-lz-border/50 last:border-0">
                        <td className="px-4 py-3 text-xs text-lz-muted">
                          {new Date(snap.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">{fmtUSD(snap.total_cost)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text hidden sm:table-cell">{fmtUSD(snap.total_revenue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                          <span className={snap.gross_profit >= 0 ? 'text-lz-success' : 'text-lz-danger'}>
                            {snap.gross_profit >= 0 ? '+' : ''}{fmtUSD(snap.gross_profit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center"><MarginBadge margin={snap.margin} /></td>
                        <td className="px-4 py-3 text-center tabular-nums text-xs text-lz-muted hidden md:table-cell">{fmtPct(snap.roi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
