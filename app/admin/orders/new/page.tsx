import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCustomers } from '@/features/crm/data/customers'
import { createOrderAction, type OrderActionState } from '@/features/orders/actions/order-actions'
import { SALE_CHANNEL_OPTIONS, CURRENCY_OPTIONS } from '@/features/orders/data/constants'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'

export const metadata: Metadata = { title: 'Nuevo pedido' }

export default async function NewOrderPage() {
  await verifySession()
  const canCreate = await checkPermission('orders.create')
  if (!canCreate) redirect('/admin/orders')

  const customers = await getCustomers()
  const customerOptions = [
    { value: '', label: 'Sin cliente asignado' },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name ?? ''}`.trim() + (c.company ? ` — ${c.company}` : ''),
    })),
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nuevo pedido"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Pedidos',   href: '/admin/orders' },
          { label: 'Nuevo' },
        ]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardBody>
            <form
              action={async (fd: FormData) => {
                'use server'
                await createOrderAction(undefined as OrderActionState, fd)
              }}
              className="space-y-4"
            >
              <Select
                label="Cliente"
                name="customer_id"
                options={customerOptions}
                defaultValue=""
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Canal de venta"
                  name="sale_channel"
                  options={SALE_CHANNEL_OPTIONS}
                  defaultValue="direct"
                />
                <Select
                  label="Moneda"
                  name="currency"
                  options={CURRENCY_OPTIONS}
                  defaultValue="USD"
                />
              </div>
              <Textarea
                label="Notas"
                name="notes"
                rows={3}
                placeholder="Instrucciones especiales, notas del cliente…"
              />
              <p className="text-xs text-lz-muted">
                El pedido se crea como borrador. Agrega productos desde el detalle del pedido.
              </p>
              <div className="flex justify-end border-t border-lz-border pt-4">
                <Button type="submit">Crear pedido</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
