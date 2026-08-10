import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { createEntryAction } from '@/features/inventory/actions/entry-actions'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { EntryHeaderForm } from '@/features/inventory/components/entry-header-form'

export const metadata: Metadata = { title: 'Nueva entrada' }

export default async function NewEntryPage() {
  await verifySession()
  const canCreate = await checkPermission('inventory.entries.create')
  if (!canCreate) redirect('/admin/inventory/entries')

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Nueva entrada de mercancía"
        description="Paso 1 de 2 — Define la información de la entrada. Luego agrega los productos."
        breadcrumbs={[
          { label: 'Dashboard',  href: '/admin' },
          { label: 'Inventario', href: '/admin/inventory' },
          { label: 'Entradas',   href: '/admin/inventory/entries' },
          { label: 'Nueva' },
        ]}
      />

      <div className="max-w-xl">
        <Card>
          <EntryHeaderForm action={createEntryAction} />
        </Card>
      </div>
    </div>
  )
}
