import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { verifySession } from '@/lib/dal'
import { getDashboardStats as getOrderStats }   from '@/features/orders/data/orders'
import { getInventoryStats }                     from '@/features/inventory/data/inventory'
import { createClient }                          from '@/lib/supabase/server'
import { Badge }      from '@/components/ui/badge'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { StatCard }   from '@/components/ui/stat-card'
import { Table }      from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton }   from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import {
  IconCart,
  IconDollar,
  IconBox,
  IconClipboard,
  IconAlertTriangle,
} from '@/components/icons'

export const metadata: Metadata = { title: 'Centro de Operaciones' }

// ─── Stats skeleton ───────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCard key={i} label="" value="" loading />
      ))}
    </div>
  )
}

// ─── Stats grid — data real ───────────────────────────────────────────────────

async function getAlertCount(): Promise<{ critical: number; high: number }> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('ai_insights')
      .select('priority')
      .eq('resolved', false)
      .in('priority', ['critical', 'high'])
    const rows = data ?? []
    return {
      critical: rows.filter(r => r.priority === 'critical').length,
      high:     rows.filter(r => r.priority === 'high').length,
    }
  } catch {
    return { critical: 0, high: 0 }
  }
}

async function StatsGrid() {
  await verifySession()

  const [orders, inventory, alertCount] = await Promise.all([
    getOrderStats().catch(() => ({ todayCount: 0, monthRevenue: 0, pendingCount: 0 })),
    getInventoryStats().catch(() => ({ total: 0, outOfStock: 0, lowStock: 0 })),
    getAlertCount(),
  ])

  const revenueVal = orders.monthRevenue > 0
    ? `USD ${orders.monthRevenue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'USD 0'

  const inventoryHelper = inventory.outOfStock > 0
    ? `${inventory.outOfStock} sin stock · ${inventory.lowStock} bajo`
    : inventory.lowStock > 0
    ? `${inventory.lowStock} producto(s) bajo mínimo`
    : `${inventory.total} SKUs en seguimiento`

  const totalAlerts = alertCount.critical + alertCount.high
  const alertHelper = alertCount.critical > 0
    ? `${alertCount.critical} crítica(s)`
    : alertCount.high > 0
    ? `${alertCount.high} de prioridad alta`
    : 'Sin alertas activas'

  const defs = [
    {
      label:      'Ingresos del mes',
      value:      revenueVal,
      helperText: `${orders.pendingCount} pedido(s) pendiente(s)`,
      icon:       <IconDollar size={18} />,
    },
    {
      label:      'Pedidos hoy',
      value:      String(orders.todayCount),
      helperText: `${orders.pendingCount} activo(s)`,
      icon:       <IconCart size={18} />,
    },
    {
      label:      'Inventario',
      value:      `${inventory.total} SKUs`,
      helperText: inventoryHelper,
      icon:       <IconBox size={18} />,
    },
    {
      label:      'Alertas',
      value:      totalAlerts > 0 ? `${totalAlerts} activa${totalAlerts !== 1 ? 's' : ''}` : '✓ Todo en orden',
      helperText: alertHelper,
      icon:       <IconAlertTriangle size={18} />,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {defs.map(def => (
        <StatCard key={def.label} {...def} />
      ))}
    </div>
  )
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Nuevo producto',     href: '/admin/catalog/products/new', icon: <IconBox size={16} /> },
  { label: 'Nueva venta manual', href: '/admin/sales/manual',         icon: <IconDollar size={16} /> },
  { label: 'Nueva compra',       href: '/admin/purchases/new',        icon: <IconClipboard size={16} /> },
  { label: 'Ver inventario',     href: '/admin/inventory',            icon: <IconBox size={16} /> },
] as const

function QuickActionsCard() {
  return (
    <Card padding={false} className="h-full">
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-lz-text">Acciones rápidas</p>
          <p className="mt-0.5 text-xs text-lz-muted">Operaciones frecuentes del sistema</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ label, href, icon }) => (
            <Link
              key={label}
              href={href}
              className="flex h-9 items-center gap-2 rounded-lg border border-lz-border bg-lz-surface px-3 text-xs font-medium text-lz-muted transition-colors hover:border-lz-primary/40 hover:text-lz-text"
            >
              {icon}
              {label}
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Recent activity ──────────────────────────────────────────────────────────

type ActivityRow = {
  fecha:   string
  accion:  string
  usuario: string
  estado:  string
}

const ACTIVITY_COLUMNS = [
  { key: 'fecha',   header: 'Fecha',   className: 'w-28' },
  { key: 'accion',  header: 'Acción' },
  { key: 'usuario', header: 'Usuario', className: 'w-36' },
  {
    key:    'estado',
    header: 'Estado',
    className: 'w-28',
    render: (row: ActivityRow) => <Badge variant="neutral">{row.estado}</Badge>,
  },
]

function ActivitySkeleton() {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20 shrink-0" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}

async function RecentActivityCard() {
  await verifySession()
  const rows: ActivityRow[] = []

  return (
    <Card padding={false} className="h-full">
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-lz-text">Actividad reciente</p>
          <p className="mt-0.5 text-xs text-lz-muted">Últimas acciones registradas en el sistema</p>
        </div>
      </CardHeader>
      {rows.length === 0 ? (
        <CardBody>
          <EmptyState
            icon={<IconCart size={20} className="text-lz-muted" />}
            title="Sin actividad reciente"
            description="Las acciones realizadas en el sistema aparecerán aquí."
          />
        </CardBody>
      ) : (
        <div className="overflow-x-auto">
          <Table columns={ACTIVITY_COLUMNS} rows={rows} keyExtractor={(_, i) => String(i)} />
        </div>
      )}
    </Card>
  )
}

// ─── Estado del negocio ───────────────────────────────────────────────────────

const BUSINESS_MODULES = [
  { label: 'Ventas y pedidos',   description: 'Gestión de órdenes y estados',       href: '/admin/orders',     badge: 'Activo' },
  { label: 'Inventario',         description: 'Control de stock, entradas y ajustes', href: '/admin/inventory',  badge: 'Activo' },
  { label: 'Finanzas',           description: 'Transacciones, cobros y pagos',       href: '/admin/finance',    badge: 'Activo' },
  { label: 'Importaciones',      description: 'Seguimiento de lotes internacionales', href: '/admin/imports',    badge: 'Activo' },
  { label: 'Catálogo',           description: 'Productos, categorías y precios',     href: '/admin/catalog',    badge: 'Activo' },
  { label: 'Clientes',           description: 'CRM, cotizaciones y seguimiento',     href: '/admin/crm/customers', badge: 'Activo' },
] as const

function BusinessStatusCard() {
  return (
    <Card padding={false}>
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-lz-text">Estado del sistema</p>
          <p className="mt-0.5 text-xs text-lz-muted">Módulos operativos del negocio</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="divide-y divide-lz-border/50">
          {BUSINESS_MODULES.map(({ label, description, href, badge }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
            >
              <div>
                <p className="text-sm font-medium text-lz-text">{label}</p>
                <p className="mt-0.5 text-xs text-lz-muted">{description}</p>
              </div>
              <Badge variant="success" className="shrink-0">{badge}</Badge>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await verifySession()
  const firstName = session.profile.full_name.split(' ')[0]

  const now  = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Buenos días'
    : hour < 19 ? 'Buenas tardes'
    : 'Buenas noches'

  const dateLabel = now.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="animate-page space-y-8">

      <div className="space-y-1">
        <p className="text-xs text-lz-muted capitalize">{dateLabel}</p>
        <PageHeader
          title="Centro de Operaciones"
          description={`${greeting}, ${firstName}. Bienvenido a Lanz Technology.`}
          breadcrumbs={[{ label: 'Dashboard' }]}
        />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsGrid />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <QuickActionsCard />
        </div>
        <div className="lg:col-span-3">
          <Suspense
            fallback={
              <Card padding={false} className="h-full">
                <CardHeader><Skeleton className="h-4 w-36" /></CardHeader>
                <CardBody><ActivitySkeleton /></CardBody>
              </Card>
            }
          >
            <RecentActivityCard />
          </Suspense>
        </div>
      </div>

      <BusinessStatusCard />

    </div>
  )
}
