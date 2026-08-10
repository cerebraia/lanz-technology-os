// Configuración central de la navegación del dashboard administrativo.
// Única fuente de verdad para grupos, submenús, permisos e iconos.
// Las rutas que no existen NO se incluyen aquí.

export type NavRole = 'administrator' | 'salesperson' | 'operator'

export type NavChild = {
  label:       string
  href:        string
  exact?:      boolean   // true = solo activo en esa ruta exacta, no en subrutas
  permission?: string    // permiso adicional específico para este ítem
}

export type NavGroup = {
  id:          string
  label:       string
  icon:        string    // nombre del icono (mapeado en sidebar)
  href?:       string    // si el grupo tiene ruta directa (sin hijos)
  permission:  string    // permiso mínimo para ver el grupo
  roles?:      NavRole[] // si se restringe por rol además del permiso
  children?:   NavChild[]
}

export const NAV_GROUPS: NavGroup[] = [
  // ── Dashboard ────────────────────────────────────────────────────────────────
  {
    id:         'dashboard',
    label:      'Dashboard',
    icon:       'home',
    href:       '/admin',
    permission: 'products.read',  // cualquier usuario autenticado
  },

  // ── Catálogo ─────────────────────────────────────────────────────────────────
  {
    id:         'catalog',
    label:      'Catálogo',
    icon:       'grid',
    permission: 'products.read',
    children: [
      { label: 'Productos',  href: '/admin/catalog/products' },
      { label: 'Categorías', href: '/admin/catalog/categories' },
    ],
  },

  // ── Inventario ────────────────────────────────────────────────────────────────
  {
    id:         'inventory',
    label:      'Inventario',
    icon:       'box',
    permission: 'inventory.read',
    roles:      ['administrator', 'operator'],
    children: [
      { label: 'Stock actual', href: '/admin/inventory',              exact: true },
      { label: 'Entradas',     href: '/admin/inventory/entries' },
      { label: 'Ajustes',      href: '/admin/inventory/adjustments' },
      { label: 'Movimientos',  href: '/admin/inventory/movements' },
      { label: 'Alertas',      href: '/admin/inventory/alerts' },
    ],
  },

  // ── Ventas ────────────────────────────────────────────────────────────────────
  {
    id:         'sales',
    label:      'Ventas',
    icon:       'dollar',
    permission: 'orders.read',
    roles:      ['administrator', 'salesperson'],
    children: [
      { label: 'Todas las ventas',   href: '/admin/sales' },
      { label: 'Nueva venta manual', href: '/admin/sales/manual' },
      { label: 'Pedidos',            href: '/admin/orders' },
    ],
  },

  // ── Clientes ──────────────────────────────────────────────────────────────────
  {
    id:         'customers',
    label:      'Clientes',
    icon:       'users',
    permission: 'customers.read',
    roles:      ['administrator', 'salesperson'],
    children: [
      { label: 'Clientes',     href: '/admin/crm/customers' },
      { label: 'Cotizaciones', href: '/admin/crm/quotes' },
      { label: 'Etiquetas',    href: '/admin/crm/tags' },
    ],
  },

  // ── Compras ───────────────────────────────────────────────────────────────────
  {
    id:         'purchases',
    label:      'Compras',
    icon:       'clipboard',
    permission: 'purchases.read',
    roles:      ['administrator', 'operator'],
    children: [
      { label: 'Órdenes de compra', href: '/admin/purchases' },
      { label: 'Nueva orden',       href: '/admin/purchases/new' },
    ],
  },

  // ── Proveedores ───────────────────────────────────────────────────────────────
  {
    id:         'suppliers',
    label:      'Proveedores',
    icon:       'send',
    permission: 'suppliers.read',
    roles:      ['administrator', 'operator'],
    children: [
      { label: 'Todos los proveedores', href: '/admin/suppliers' },
      { label: 'Nuevo proveedor',       href: '/admin/suppliers/new' },
    ],
  },

  // ── Importaciones ─────────────────────────────────────────────────────────────
  {
    id:         'imports',
    label:      'Importaciones',
    icon:       'globe',
    permission: 'imports.read',
    roles:      ['administrator', 'operator'],
    children: [
      { label: 'Importaciones',      href: '/admin/imports' },
      { label: 'Nueva importación',  href: '/admin/imports/new' },
    ],
  },

  // ── Finanzas ──────────────────────────────────────────────────────────────────
  {
    id:         'finance',
    label:      'Finanzas',
    icon:       'dollar',
    permission: 'finance.read',
    roles:      ['administrator'],
    children: [
      { label: 'Resumen',          href: '/admin/finance',               exact: true },
      { label: 'Cuentas',          href: '/admin/finance/accounts' },
      { label: 'Movimientos',      href: '/admin/finance/transactions' },
      { label: 'Por pagar',        href: '/admin/finance/payables' },
      { label: 'Por cobrar',       href: '/admin/finance/receivables' },
      { label: 'Flujo de caja',    href: '/admin/finance/cash-flow' },
      { label: 'Rentabilidad',     href: '/admin/finance/profitability' },
    ],
  },

  // ── Marketing ─────────────────────────────────────────────────────────────────
  {
    id:         'marketing',
    label:      'Marketing',
    icon:       'megaphone',
    permission: 'marketing.read',
    roles:      ['administrator'],
    children: [
      { label: 'Resumen',    href: '/admin/marketing',           exact: true },
      { label: 'Campañas',   href: '/admin/marketing/campaigns' },
      { label: 'Cupones',    href: '/admin/marketing/coupons' },
      { label: 'Segmentos',  href: '/admin/marketing/segments' },
      { label: 'Analítica',  href: '/admin/marketing/analytics' },
    ],
  },

  // ── Reportes ──────────────────────────────────────────────────────────────────
  {
    id:         'reports',
    label:      'Reportes',
    icon:       'bar',
    permission: 'reports.read',
    roles:      ['administrator', 'salesperson'],
    children: [
      { label: 'Resumen',         href: '/admin/reports',                  exact: true },
      { label: 'Ventas',          href: '/admin/reports/sales',            permission: 'reports.sales.read' },
      { label: 'Inventario',      href: '/admin/reports/inventory',        permission: 'reports.inventory.read', roles: ['administrator'] },
      { label: 'Finanzas',        href: '/admin/reports/finance',          permission: 'reports.finance.read',   roles: ['administrator'] },
      { label: 'Importaciones',   href: '/admin/reports/imports',          roles: ['administrator'] },
      { label: 'Clientes',        href: '/admin/reports/customers' },
      { label: 'Marketing',       href: '/admin/reports/marketing',        roles: ['administrator'] },
    ] as (NavChild & { roles?: NavRole[] })[],
  },

  // ── Inteligencia Artificial ───────────────────────────────────────────────────
  {
    id:         'ai',
    label:      'Inteligencia Artificial',
    icon:       'circle-dot',
    permission: 'ai.read',
    roles:      ['administrator'],
    children: [
      { label: 'Resumen IA',       href: '/admin/ai',                   exact: true },
      { label: 'Asistente',        href: '/admin/ai/assistant' },
      { label: 'Insights',         href: '/admin/ai/insights' },
      { label: 'Recomendaciones',  href: '/admin/ai/recommendations' },
      { label: 'Predicciones',     href: '/admin/ai/predictions' },
    ],
  },

  // ── Automatizaciones ──────────────────────────────────────────────────────────
  {
    id:         'automations',
    label:      'Automatizaciones',
    icon:       'circle-check',
    permission: 'automations.read',
    roles:      ['administrator'],
    children: [
      { label: 'Automatizaciones',   href: '/admin/automations',         exact: true },
      { label: 'Nueva',              href: '/admin/automations/new' },
      { label: 'Historial',          href: '/admin/automations/history' },
      { label: 'Logs',               href: '/admin/automations/logs' },
    ],
  },

  // ── Configuración ─────────────────────────────────────────────────────────────
  {
    id:         'settings',
    label:      'Configuración',
    icon:       'settings',
    permission: 'settings.read',
    roles:      ['administrator'],
    children: [
      { label: 'Datos del negocio', href: '/admin/settings',               exact: true },
      { label: 'Usuarios',          href: '/admin/settings/users' },
      { label: 'Tasas de cambio',   href: '/admin/settings/exchange-rates' },
    ],
  },
]
