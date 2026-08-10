import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getCustomers } from '@/features/crm/data/customers'
import { PageHeader }   from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Input }    from '@/components/ui/input'
import { Select }   from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button }   from '@/components/ui/button'
import { createQuoteAction, type CrmActionState } from '@/features/crm/actions/crm-actions'

export const metadata: Metadata = { title: 'Nueva cotización' }

type Props = { searchParams: Promise<{ customer?: string }> }

export default async function NewQuotePage({ searchParams }: Props) {
  await verifySession()
  const canCreate = await checkPermission('crm.quotes.create')
  if (!canCreate) redirect('/admin/crm/quotes')

  const sp        = await searchParams
  const customers = await getCustomers()

  const customerOptions = [
    { value: '',    label: 'Sin cliente asignado' },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name ?? ''}`.trim() + (c.company ? ` — ${c.company}` : ''),
    })),
  ]

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva cotización"
        breadcrumbs={[
          { label: 'Dashboard',    href: '/admin' },
          { label: 'CRM',          href: '/admin/crm' },
          { label: 'Cotizaciones', href: '/admin/crm/quotes' },
          { label: 'Nueva' },
        ]}
      />
      <div className="mx-auto max-w-xl">
        <Card padding={false}>
          <CardBody>
            <form action={async (fd: FormData) => { 'use server'; await createQuoteAction(undefined as CrmActionState, fd) }} className="space-y-4">
              <Select
                label="Cliente"
                name="customer_id"
                options={customerOptions}
                defaultValue={sp.customer ?? ''}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Fecha de expiración"
                  name="expires_at"
                  type="date"
                />
              </div>
              <Textarea
                label="Notas"
                name="notes"
                rows={3}
                placeholder="Descripción de la propuesta, condiciones, etc."
              />
              <p className="text-xs text-lz-muted">
                La cotización se crea como borrador. Puedes agregar productos y enviarla desde la lista.
              </p>
              <div className="flex justify-end border-t border-lz-border pt-4">
                <Button type="submit">Crear cotización</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
