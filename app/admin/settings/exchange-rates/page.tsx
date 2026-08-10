import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCurrentRate, getRateHistory } from '@/lib/exchange-rates/exchange-rate-service'
import { RateForm }   from '@/features/exchange-rates/components/rate-form'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge }      from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Tasas de cambio' }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-VE', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Caracas',
  })
}

export default async function ExchangeRatesPage() {
  await verifySession()
  const canManage = await checkPermission('settings.manage')
  if (!canManage) redirect('/admin/settings')

  const [bcvRate, binanceRate, bcvHistory, binanceHistory] = await Promise.all([
    getCurrentRate('bcv'),
    getCurrentRate('binance'),
    getRateHistory('bcv', 10),
    getRateHistory('binance', 10),
  ])

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Tasas de cambio"
        description="Gestiona las tasas BCV y Binance utilizadas para mostrar precios en bolívares."
        breadcrumbs={[
          { label: 'Dashboard',     href: '/admin' },
          { label: 'Configuración', href: '/admin/settings' },
          { label: 'Tasas de cambio' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* BCV */}
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Tasa BCV</p>
              <p className="mt-0.5 text-xs text-lz-muted">Banco Central de Venezuela — USD/VES</p>
            </div>
            <div className="text-right">
              {bcvRate ? (
                <>
                  <p className="text-lg font-bold tabular-nums text-lz-text">
                    {Number(bcvRate.rate).toFixed(2)} Bs/USD
                  </p>
                  <p className="text-[11px] text-lz-muted">{fmtDate(bcvRate.effective_at)}</p>
                  <Badge variant={bcvRate.is_manual ? 'warning' : 'success'}>
                    {bcvRate.is_manual ? 'Manual' : 'Auto'}
                  </Badge>
                </>
              ) : (
                <p className="text-sm text-lz-muted">Sin tasa configurada</p>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <RateForm
              source="bcv"
              currentRate={bcvRate ? Number(bcvRate.rate) : null}
              label="Nueva tasa BCV (Bs por 1 USD)"
              currency="USD"
            />
          </CardBody>
        </Card>

        {/* Binance */}
        <Card padding={false}>
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-lz-text">Tasa Binance</p>
              <p className="mt-0.5 text-xs text-lz-muted">Referencia P2P — USDT/VES</p>
            </div>
            <div className="text-right">
              {binanceRate ? (
                <>
                  <p className="text-lg font-bold tabular-nums text-lz-text">
                    {Number(binanceRate.rate).toFixed(2)} Bs/USDT
                  </p>
                  <p className="text-[11px] text-lz-muted">{fmtDate(binanceRate.effective_at)}</p>
                  <Badge variant={binanceRate.is_manual ? 'warning' : 'success'}>
                    {binanceRate.is_manual ? 'Manual' : 'Auto'}
                  </Badge>
                </>
              ) : (
                <p className="text-sm text-lz-muted">Sin tasa configurada</p>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <RateForm
              source="binance"
              currentRate={binanceRate ? Number(binanceRate.rate) : null}
              label="Nueva tasa Binance (Bs por 1 USDT)"
              currency="USDT"
            />
          </CardBody>
        </Card>
      </div>

      {/* Historial BCV */}
      {bcvHistory.length > 0 && (
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Historial BCV</p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-sidebar">
                <tr>
                  {['Tasa', 'Estado', 'Tipo', 'Fecha'].map((h, i) => (
                    <th key={i} className={['px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted', i === 0 ? 'text-left' : 'text-right'].join(' ')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bcvHistory.map((r) => (
                  <tr key={r.id} className="border-b border-lz-border/50 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-sm font-medium">{Number(r.rate).toFixed(4)} Bs</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-lz-muted">
                      {r.is_manual ? 'Manual' : 'Auto'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-lz-muted">{fmtDate(r.effective_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Historial Binance */}
      {binanceHistory.length > 0 && (
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Historial Binance</p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-lz-border bg-lz-sidebar">
                <tr>
                  {['Tasa', 'Estado', 'Tipo', 'Fecha'].map((h, i) => (
                    <th key={i} className={['px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-lz-muted', i === 0 ? 'text-left' : 'text-right'].join(' ')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {binanceHistory.map((r) => (
                  <tr key={r.id} className="border-b border-lz-border/50 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-sm font-medium">{Number(r.rate).toFixed(4)} Bs</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-lz-muted">
                      {r.is_manual ? 'Manual' : 'Auto'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-lz-muted">{fmtDate(r.effective_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
