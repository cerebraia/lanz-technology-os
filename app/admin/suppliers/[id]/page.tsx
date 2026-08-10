import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getSupplierById } from '@/features/suppliers/data/suppliers'
import { SupplierToggle } from '@/features/suppliers/components/supplier-toggle'
import { PURCHASE_STATUS_LABELS } from '@/features/purchases/data/purchases'
import { PageHeader }  from '@/components/ui/page-header'
import { Badge }       from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Alert }       from '@/components/ui/alert'
import { EmptyState }  from '@/components/ui/empty-state'
import { IconClipboard } from '@/components/icons'

export const metadata: Metadata = { title: 'Detalle de proveedor' }

type Props = { params: Promise<{ id: string }> }

type PurchaseRow = {
  id:         string
  reference:  string
  status:     string
  currency:   string
  subtotal:   number
  created_at: string
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead = await checkPermission('suppliers.read')
  if (!canRead) redirect('/admin')

  const [supplier, canUpdate, canDisable] = await Promise.all([
    getSupplierById(id),
    checkPermission('suppliers.update'),
    checkPermission('suppliers.disable'),
  ])

  if (!supplier) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: PurchaseRow[] = ((supplier as any).purchase_orders ?? [])
    .sort((a: PurchaseRow, b: PurchaseRow) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={supplier.name}
        description={supplier.company ?? supplier.country}
        breadcrumbs={[
          { label: 'Dashboard',   href: '/admin' },
          { label: 'Compras',     href: '/admin/purchases' },
          { label: 'Proveedores', href: '/admin/suppliers' },
          { label: supplier.name },
        ]}
        secondaryActions={
          supplier.is_active
            ? <Badge variant="success">Activo</Badge>
            : <Badge variant="neutral">Inactivo</Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Link
                href={`/admin/suppliers/${id}/edit`}
                className="inline-flex h-8 items-center rounded-lg border border-lz-border bg-transparent px-3 text-xs text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
              >
                Editar
              </Link>
            )}
            <SupplierToggle
              supplierId={id}
              isActive={supplier.is_active}
              canDisable={canDisable}
            />
          </div>
        }
      />

      {!supplier.is_active && (
        <Alert variant="warning">
          Este proveedor está inactivo. No aparecerá en los selectores de nuevas órdenes de compra.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Info general */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Información general</p>
          </CardHeader>
          <CardBody>
            <dl className="divide-y divide-lz-border/50 text-sm">
              {[
                { label: 'Nombre',    value: supplier.name },
                { label: 'Empresa',   value: supplier.company   ?? '—' },
                { label: 'Email',     value: supplier.email     ?? '—' },
                { label: 'Teléfono',  value: supplier.phone     ?? '—' },
                { label: 'País',      value: supplier.country },
                { label: 'Ciudad',    value: supplier.city      ?? '—' },
                { label: 'Tax ID',    value: supplier.tax_id    ?? '—' },
                { label: 'Sitio web', value: supplier.website   ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-lz-muted">{label}</dt>
                  <dd className="truncate text-right text-lz-text">{value}</dd>
                </div>
              ))}
              {supplier.notes && (
                <div className="py-2 last:pb-0">
                  <dt className="mb-1 text-lz-muted">Notas</dt>
                  <dd className="text-lz-text">{supplier.notes}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        {/* Estadísticas + historial */}
        <div className="space-y-6 lg:col-span-2">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Órdenes',          value: supplier.total_orders },
              {
                label: 'Total comprado',
                value: `USD ${supplier.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              },
              {
                label: 'Última compra',
                value: supplier.last_order_at
                  ? new Date(supplier.last_order_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—',
              },
              {
                label: 'Estado',
                value: supplier.is_active ? 'Activo' : 'Inactivo',
              },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center !p-4">
                <p className="text-base font-semibold tabular-nums text-lz-text">{value}</p>
                <p className="mt-0.5 text-[11px] text-lz-muted">{label}</p>
              </Card>
            ))}
          </div>

          {/* Historial de órdenes */}
          <Card padding={false}>
            <CardHeader>
              <div>
                <p className="text-sm font-semibold text-lz-text">Órdenes de compra recientes</p>
                <p className="mt-0.5 text-xs text-lz-muted">Últimas 10 órdenes asociadas</p>
              </div>
              <Link
                href={`/admin/purchases?supplier=${id}`}
                className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
              >
                Ver todas
              </Link>
            </CardHeader>

            {orders.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={<IconClipboard size={18} className="text-lz-muted" />}
                  title="Sin órdenes de compra"
                  description="Las órdenes vinculadas a este proveedor aparecerán aquí."
                />
              </CardBody>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-lz-border bg-lz-sidebar">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Referencia</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-lz-muted">Estado</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted">Subtotal</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-lz-muted hidden sm:table-cell">Fecha</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const st = PURCHASE_STATUS_LABELS[order.status]
                      return (
                        <tr key={order.id} className="border-b border-lz-border/50 last:border-0">
                          <td className="px-4 py-3 font-medium text-lz-text">{order.reference}</td>
                          <td className="px-4 py-3">
                            <Badge variant={st?.variant ?? 'neutral'}>{st?.label ?? order.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-lz-text">
                            {order.currency} {order.subtotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-lz-muted hidden sm:table-cell">
                            {new Date(order.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/purchases/${order.id}`}
                              className="text-xs text-lz-muted transition-colors hover:text-lz-accent"
                            >
                              Ver
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}
