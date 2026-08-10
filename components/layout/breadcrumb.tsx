'use client'

import { usePathname } from 'next/navigation'
import { Breadcrumb } from '@/components/ui/breadcrumb'

const SEGMENT_LABELS: Record<string, string> = {
  admin:         'Dashboard',
  catalog:       'Catálogo',
  inventory:     'Inventario',
  orders:        'Pedidos',
  customers:     'Clientes',
  finance:       'Finanzas',
  marketing:     'Marketing',
  reports:       'Reportes',
  settings:      'Configuración',
  products:      'Productos',
  categories:    'Categorías',
  new:           'Nuevo',
}

export function AutoBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const items = segments.map((segment, index) => {
    const href  = '/' + segments.slice(0, index + 1).join('/')
    const label = SEGMENT_LABELS[segment] ?? 'Editar'
    const isLast = index === segments.length - 1
    return { label, href: isLast ? undefined : href }
  })

  return <Breadcrumb items={items} />
}
