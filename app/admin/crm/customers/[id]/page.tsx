import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCustomerById, getCustomerStats } from '@/features/crm/data/customers'
import { getCustomerActivity }               from '@/features/crm/data/activity'
import { getQuotesByCustomer }               from '@/features/crm/data/quotes'
import { getTags }                           from '@/features/crm/data/tags'
import { CustomerForm }   from '@/features/crm/components/customer-form'
import { ActivityFeed }   from '@/features/crm/components/activity-feed'
import { NoteForm }       from '@/features/crm/components/note-form'
import { TagBadge }       from '@/features/crm/components/tag-badge'
import { PageHeader }     from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge }          from '@/components/ui/badge'
import { QUOTE_STATUS_LABELS, SOURCE_LABELS } from '@/features/crm/data/constants'
import { IconUsers, IconDollar, IconCart } from '@/components/icons'
import { toggleTagAssignmentAction } from '@/features/crm/actions/crm-actions'

export const metadata: Metadata = { title: 'Perfil del cliente' }

type Props = { params: Promise<{ id: string }> }

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-lz-border/40 last:border-0">
      <span className="text-xs text-lz-muted shrink-0">{label}</span>
      <span className="text-xs text-lz-text text-right">{value}</span>
    </div>
  )
}

export default async function CustomerProfilePage({ params }: Props) {
  const { id } = await params
  await verifySession()

  const canRead   = await checkPermission('crm.read')
  if (!canRead) redirect('/admin/crm')
  const canUpdate = await checkPermission('crm.update')
  const canCreate = await checkPermission('crm.create')

  const [customer, stats, activity, quotes, allTags] = await Promise.all([
    getCustomerById(id),
    getCustomerStats(id),
    getCustomerActivity(id),
    getQuotesByCustomer(id),
    getTags(),
  ])

  if (!customer) notFound()

  const assignedTagIds = new Set(
    customer.customer_tag_assignments?.map((a) => a.customer_tags?.id).filter(Boolean) ?? []
  )

  const fullName = `${customer.first_name} ${customer.last_name ?? ''}`.trim()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title={fullName}
        description={customer.company ?? undefined}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'CRM',       href: '/admin/crm' },
          { label: 'Clientes',  href: '/admin/crm/customers' },
          { label: fullName },
        ]}
        secondaryActions={
          customer.archived_at
            ? <Badge variant="neutral">Archivado</Badge>
            : <Badge variant="success">Activo</Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Info */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Información</p></CardHeader>
            <CardBody>
              <InfoRow label="Empresa"  value={customer.company} />
              <InfoRow label="Email"    value={customer.email} />
              <InfoRow label="Teléfono" value={customer.phone} />
              <InfoRow label="WhatsApp" value={customer.whatsapp} />
              <InfoRow label="País"     value={customer.country} />
              <InfoRow label="Ciudad"   value={customer.city} />
              <InfoRow label="Dirección" value={customer.address} />
              <InfoRow label="Origen"   value={customer.source ? SOURCE_LABELS[customer.source] : null} />
              {customer.notes && (
                <div className="mt-3 rounded-lg bg-lz-surface-hover/30 p-3">
                  <p className="text-xs text-lz-muted">{customer.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Stats */}
          <Card>
            <p className="mb-3 text-sm font-semibold text-lz-text">Estadísticas</p>
            <div className="space-y-3">
              {[
                { icon: <IconCart size={14} />,   label: 'Pedidos',          value: String(stats.orderCount) },
                { icon: <IconDollar size={14} />, label: 'Total gastado',    value: `USD ${stats.totalSpent.toFixed(2)}` },
                { icon: <IconDollar size={14} />, label: 'Ticket promedio',  value: `USD ${stats.avgTicket.toFixed(2)}` },
                {
                  icon: <IconUsers size={14} />,
                  label: 'Última compra',
                  value: stats.lastOrder
                    ? new Date(stats.lastOrder).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin compras',
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-lz-muted">
                    {icon}
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-lz-text tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tags */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Etiquetas</p></CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {customer.customer_tag_assignments?.map((a) =>
                  a.customer_tags ? (
                    <TagBadge key={a.customer_tags.id} name={a.customer_tags.name} color={a.customer_tags.color} />
                  ) : null
                )}
                {(customer.customer_tag_assignments?.length ?? 0) === 0 && (
                  <p className="text-xs text-lz-muted">Sin etiquetas asignadas.</p>
                )}
              </div>
              {canUpdate && (
                <div className="mt-4 border-t border-lz-border pt-4">
                  <p className="mb-2 text-xs text-lz-muted">Agregar / quitar etiquetas:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const assigned = assignedTagIds.has(tag.id)
                      return (
                        <form key={tag.id} action={async () => {
                          'use server'
                          await toggleTagAssignmentAction(id, tag.id, !assigned)
                        }}>
                          <button
                            type="submit"
                            className={['rounded-full border px-2 py-0.5 text-[11px] font-medium transition-opacity', assigned ? 'opacity-100' : 'opacity-40 hover:opacity-70'].join(' ')}
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {assigned ? '✓ ' : '+ '}{tag.name}
                          </button>
                        </form>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit form */}
          {canUpdate && (
            <Card padding={false}>
              <CardHeader><p className="text-sm font-semibold text-lz-text">Editar información</p></CardHeader>
              <CardBody><CustomerForm customer={customer} /></CardBody>
            </Card>
          )}

          {/* Quotes */}
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Cotizaciones</p>
              <Link href={`/admin/crm/quotes/new?customer=${id}`} className="text-xs text-lz-accent hover:underline">Nueva cotización</Link>
            </CardHeader>
            <CardBody>
              {quotes.length === 0 ? (
                <p className="text-sm text-lz-muted">Sin cotizaciones.</p>
              ) : (
                <ul className="divide-y divide-lz-border/50">
                  {quotes.map((q) => {
                    const s = QUOTE_STATUS_LABELS[q.status]
                    return (
                      <li key={q.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-xs text-lz-muted">
                            {new Date(q.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          {q.notes && <p className="text-xs text-lz-text">{q.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-sm font-semibold text-lz-text">USD {q.total.toFixed(2)}</span>
                          <Badge variant={s?.variant ?? 'neutral'}>{s?.label ?? q.status}</Badge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Note form */}
          {canCreate && (
            <Card padding={false}>
              <CardHeader><p className="text-sm font-semibold text-lz-text">Agregar nota</p></CardHeader>
              <CardBody><NoteForm customerId={id} /></CardBody>
            </Card>
          )}

          {/* Activity timeline */}
          <Card padding={false}>
            <CardHeader><p className="text-sm font-semibold text-lz-text">Historial de actividad</p></CardHeader>
            <CardBody>
              <ActivityFeed items={activity} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
