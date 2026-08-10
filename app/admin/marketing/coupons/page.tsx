import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCoupons, type DiscountCoupon } from '@/features/marketing/data/coupons'
import { COUPON_TYPE_LABELS } from '@/features/marketing/data/constants'
import { CouponForm }   from '@/features/marketing/components/coupon-form'
import { CouponToggle } from '@/features/marketing/components/coupon-toggle'
import { PageHeader }   from '@/components/ui/page-header'
import { Badge }        from '@/components/ui/badge'
import { Table }        from '@/components/ui/table'
import { EmptyState }   from '@/components/ui/empty-state'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { IconMegaphone } from '@/components/icons'

export const metadata: Metadata = { title: 'Cupones de descuento' }

export default async function CouponsPage() {
  await verifySession()
  const canRead   = await checkPermission('marketing.read')
  if (!canRead) redirect('/admin/marketing')
  const canCreate = await checkPermission('marketing.create')
  const canUpdate = await checkPermission('marketing.update')

  const coupons = await getCoupons()
  const active  = coupons.filter((c) => c.is_active).length

  const COLUMNS = [
    {
      key: 'code', header: 'Código',
      render: (row: DiscountCoupon) => (
        <div>
          <p className="font-mono text-sm font-bold text-lz-text">{row.code}</p>
          {row.description && <p className="text-xs text-lz-muted">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'type', header: 'Tipo',
      render: (row: DiscountCoupon) => (
        <span className="text-xs text-lz-muted">{COUPON_TYPE_LABELS[row.type] ?? row.type}</span>
      ),
    },
    {
      key: 'value', header: 'Descuento', className: 'text-right',
      render: (row: DiscountCoupon) => (
        <span className="tabular-nums text-sm font-semibold text-lz-text">
          {row.type === 'percentage' ? `${row.value}%` : `USD ${row.value.toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'usage', header: 'Usos', className: 'text-right hidden sm:table-cell',
      render: (row: DiscountCoupon) => (
        <span className="tabular-nums text-xs text-lz-muted">
          {row.used_count}{row.usage_limit ? ` / ${row.usage_limit}` : ''}
        </span>
      ),
    },
    {
      key: 'expires_at', header: 'Vence', className: 'hidden md:table-cell',
      render: (row: DiscountCoupon) => (
        <span className="text-xs text-lz-muted">
          {row.expires_at ? new Date(row.expires_at + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Estado',
      render: (row: DiscountCoupon) => (
        <CouponToggle couponId={row.id} isActive={row.is_active} canUpdate={canUpdate} />
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Cupones de descuento"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Marketing', href: '/admin/marketing' },
          { label: 'Cupones' },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2">
            <Badge variant="success">{active} activos</Badge>
            <Badge variant="neutral">{coupons.length - active} inactivos</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coupon list */}
        <div className="lg:col-span-2">
          {coupons.length === 0 ? (
            <EmptyState
              icon={<IconMegaphone size={22} className="text-lz-muted" />}
              title="Sin cupones"
              description="Crea cupones para ofrecer descuentos a tus clientes."
            />
          ) : (
            <Table columns={COLUMNS} rows={coupons} keyExtractor={(r) => r.id} />
          )}
        </div>

        {/* Create form */}
        {canCreate && (
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Nuevo cupón</p></CardHeader>
            <CardBody><CouponForm /></CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
