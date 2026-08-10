import type { Metadata } from 'next'
import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { IconGrid, IconBox } from '@/components/icons'

export const metadata: Metadata = { title: 'Catálogo' }

const NAV_ITEMS = [
  {
    label:       'Productos',
    description: 'Gestionar productos, precios e imágenes',
    href:        '/admin/catalog/products',
    icon:        <IconBox size={20} />,
  },
  {
    label:       'Categorías',
    description: 'Organizar el catálogo en categorías',
    href:        '/admin/catalog/categories',
    icon:        <IconGrid size={20} />,
  },
] as const

export default async function CatalogPage() {
  await verifySession()

  return (
    <div className="space-y-6 animate-page">
      <PageHeader
        title="Catálogo"
        description="Gestionar productos y categorías del sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Catálogo' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card variant="interactive" className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lz-primary/15 text-lz-accent">
                {item.icon}
              </div>
              <div>
                <p className="font-medium text-lz-text">{item.label}</p>
                <p className="mt-0.5 text-xs text-lz-muted">{item.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
