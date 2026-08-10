import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { verifySession, checkPermission } from '@/lib/dal'
import { getTags, type CustomerTag } from '@/features/crm/data/tags'
import { TagBadge }          from '@/features/crm/components/tag-badge'
import { TagCreateFormClient } from '@/features/crm/components/tag-create-form'
import { PageHeader }        from '@/components/ui/page-header'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { EmptyState }        from '@/components/ui/empty-state'
import { IconUsers }         from '@/components/icons'
import { deleteTagAction }   from '@/features/crm/actions/crm-actions'

export const metadata: Metadata = { title: 'Etiquetas CRM' }

async function DeleteTagForm({ tag }: { tag: CustomerTag }) {
  async function action() {
    'use server'
    await deleteTagAction(tag.id)
  }
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs text-lz-muted transition-colors hover:text-lz-danger"
        title={`Eliminar etiqueta "${tag.name}"`}
      >
        Eliminar
      </button>
    </form>
  )
}

export default async function TagsPage() {
  await verifySession()
  const canRead   = await checkPermission('crm.read')
  if (!canRead) redirect('/admin/crm')
  const canCreate = await checkPermission('crm.create')
  const canDelete = await checkPermission('crm.delete')

  const tags = await getTags()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Etiquetas"
        description="Segmenta y categoriza tus clientes."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'CRM',       href: '/admin/crm' },
          { label: 'Etiquetas' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tag list */}
        <Card padding={false}>
          <CardHeader>
            <p className="text-sm font-semibold text-lz-text">Etiquetas activas</p>
          </CardHeader>
          <CardBody>
            {tags.length === 0 ? (
              <EmptyState
                icon={<IconUsers size={20} className="text-lz-muted" />}
                title="Sin etiquetas"
                description="Crea etiquetas para segmentar tus clientes."
              />
            ) : (
              <ul className="divide-y divide-lz-border/50">
                {tags.map((tag) => (
                  <li key={tag.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <TagBadge name={tag.name} color={tag.color} />
                    {canDelete && <DeleteTagForm tag={tag} />}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Create form */}
        {canCreate && (
          <Card padding={false}>
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Nueva etiqueta</p>
            </CardHeader>
            <CardBody>
              <TagCreateFormClient />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
