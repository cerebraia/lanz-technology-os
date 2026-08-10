import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Button }      from '@/components/ui/button'
import { Badge }       from '@/components/ui/badge'
import { Input }       from '@/components/ui/input'
import { Textarea }    from '@/components/ui/textarea'
import { Select }      from '@/components/ui/select'
import { Checkbox }    from '@/components/ui/checkbox'
import { Switch }      from '@/components/ui/switch'
import { Alert }       from '@/components/ui/alert'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card'
import { Table }       from '@/components/ui/table'
import { EmptyState }  from '@/components/ui/empty-state'
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton'
import { Spinner }     from '@/components/ui/spinner'
import { Tooltip }     from '@/components/ui/tooltip'
import { PageHeader }  from '@/components/ui/page-header'
import { StatCard }    from '@/components/ui/stat-card'
import { colors }      from '@/lib/design/tokens'
import { InteractiveDemo } from './_interactive'
import {
  IconBox, IconCart, IconUsers, IconDollar, IconPlus, IconSearch,
} from '@/components/icons'

export const metadata: Metadata = { title: 'Design System' }

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-lz-text">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-lz-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Preview({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={['rounded-xl border border-lz-border/50 bg-lz-bg p-6', className].join(' ')}>
      {children}
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-medium text-lz-muted">{children}</p>
}

// ─── Sample table data ────────────────────────────────────────────────────────

type SampleRow = { id: string; name: string; status: string; date: string; amount: string }

const SAMPLE_ROWS: SampleRow[] = [
  { id: '001', name: 'DJI Mini 4 Pro',     status: 'Activo',    date: '2026-07-28', amount: '$1,299' },
  { id: '002', name: 'DJI Osmo Pocket 3',  status: 'Activo',    date: '2026-07-27', amount: '$519' },
  { id: '003', name: 'DJI RC 2',           status: 'Agotado',   date: '2026-07-25', amount: '$229' },
  { id: '004', name: 'DJI Air 3S',         status: 'Borrador',  date: '2026-07-20', amount: '$1,099' },
]

const SAMPLE_COLUMNS = [
  { key: 'id',     header: '#',      className: 'w-12' },
  { key: 'name',   header: 'Producto' },
  {
    key: 'status',
    header: 'Estado',
    render: (row: SampleRow) => {
      const variant =
        row.status === 'Activo'   ? 'success' :
        row.status === 'Agotado'  ? 'danger'  : 'neutral'
      return <Badge variant={variant as 'success' | 'danger' | 'neutral'}>{row.status}</Badge>
    },
  },
  { key: 'date',   header: 'Fecha' },
  { key: 'amount', header: 'Precio', className: 'text-right' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="space-y-12 animate-page">

      {/* Header */}
      <PageHeader
        title="Design System"
        description="Componentes, tokens y patrones visuales de Lanz Technology OS."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Design System' },
        ]}
        actions={
          <Badge variant="warning">Solo desarrollo</Badge>
        }
      />

      {/* ── 1. Paleta de colores ─────────────────────────────────────────────── */}
      <Section title="Paleta de colores" description="Colores oficiales del sistema. Usar siempre las clases lz-* de Tailwind.">
        <Preview>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {(Object.entries(colors) as [string, string][]).map(([name, hex]) => (
              <div key={name} className="space-y-2">
                <div
                  className="h-10 rounded-lg border border-lz-border/40"
                  style={{ backgroundColor: hex }}
                />
                <div>
                  <p className="text-xs font-medium capitalize text-lz-text">{name}</p>
                  <p className="text-[10px] text-lz-muted">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Preview>
      </Section>

      {/* ── 2. Tipografía ────────────────────────────────────────────────────── */}
      <Section title="Tipografía" description="Poppins — pesos 300, 400, 500, 600, 700.">
        <Preview>
          <div className="space-y-3">
            {[
              { weight: 'font-light',    label: '300 Light',    text: 'La tecnología avanza cuando el diseño la guía.' },
              { weight: 'font-normal',   label: '400 Regular',  text: 'La tecnología avanza cuando el diseño la guía.' },
              { weight: 'font-medium',   label: '500 Medium',   text: 'La tecnología avanza cuando el diseño la guía.' },
              { weight: 'font-semibold', label: '600 SemiBold', text: 'La tecnología avanza cuando el diseño la guía.' },
              { weight: 'font-bold',     label: '700 Bold',     text: 'La tecnología avanza cuando el diseño la guía.' },
            ].map(({ weight, label, text }) => (
              <div key={label} className="flex items-baseline gap-4">
                <span className="w-24 shrink-0 text-[10px] text-lz-muted">{label}</span>
                <p className={[weight, 'text-sm text-lz-text'].join(' ')}>{text}</p>
              </div>
            ))}
            <div className="mt-4 border-t border-lz-border/50 pt-4 space-y-1.5">
              <p className="text-3xl font-semibold text-lz-text">Título grande</p>
              <p className="text-xl font-semibold text-lz-text">Título de sección</p>
              <p className="text-base font-medium text-lz-text">Subtítulo</p>
              <p className="text-sm text-lz-text">Texto normal del sistema</p>
              <p className="text-xs text-lz-muted">Texto secundario y etiquetas</p>
              <p className="text-[10px] text-lz-muted">Texto de ayuda y metadatos</p>
            </div>
          </div>
        </Preview>
      </Section>

      {/* ── 3. Botones ───────────────────────────────────────────────────────── */}
      <Section title="Botones" description="5 variantes, 4 tamaños, estados loading y disabled.">
        <Preview className="space-y-4">
          <div>
            <Label>Variantes</Label>
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
            </Row>
          </div>
          <div>
            <Label>Tamaños</Label>
            <Row>
              <Button size="sm">Pequeño</Button>
              <Button size="md">Mediano</Button>
              <Button size="lg">Grande</Button>
              <Button size="icon" aria-label="Buscar"><IconSearch size={16} /></Button>
            </Row>
          </div>
          <div>
            <Label>Estados</Label>
            <Row>
              <Button loading>Cargando</Button>
              <Button disabled>Deshabilitado</Button>
            </Row>
          </div>
        </Preview>
      </Section>

      {/* ── 4. Badges ────────────────────────────────────────────────────────── */}
      <Section title="Badges" description="Etiquetas de estado para productos, pedidos e inventario.">
        <Preview>
          <Row>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Activo</Badge>
            <Badge variant="warning">Pendiente</Badge>
            <Badge variant="danger">Agotado</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="muted">Muted</Badge>
          </Row>
        </Preview>
      </Section>

      {/* ── 5. Formularios ───────────────────────────────────────────────────── */}
      <Section title="Formularios" description="Input, Textarea, Select, Checkbox, Switch.">
        <Preview className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Input label="Nombre del producto" placeholder="Ej. DJI Mini 4 Pro" />
            <Input label="Email" placeholder="usuario@ejemplo.com" type="email" required />
            <Input label="Campo con error" placeholder="..." error="Este campo es obligatorio" />
            <Input label="Deshabilitado" placeholder="No editable" disabled />
          </div>
          <div className="space-y-4">
            <Textarea label="Descripción" placeholder="Describe el producto…" rows={3} />
            <Select
              label="Categoría"
              placeholder="Seleccionar categoría"
              options={[
                { value: 'drones',    label: 'Drones' },
                { value: 'camaras',   label: 'Cámaras' },
                { value: 'accesorios', label: 'Accesorios' },
              ]}
            />
            <div className="space-y-3 pt-1">
              <Checkbox label="Producto destacado" />
              <Checkbox label="En oferta" defaultChecked />
              <Checkbox label="Deshabilitado" disabled />
            </div>
            <div className="space-y-3">
              <Switch label="Publicado en tienda" />
              <Switch label="Activo (habilitado)" defaultChecked />
              <Switch label="Deshabilitado" disabled />
            </div>
          </div>
        </Preview>
      </Section>

      {/* ── 6. Alertas ───────────────────────────────────────────────────────── */}
      <Section title="Alertas" description="Para mensajes de estado, confirmación y error.">
        <Preview className="space-y-3">
          <Alert variant="info"    title="Información">El sistema procesará este cambio en los próximos minutos.</Alert>
          <Alert variant="success" title="Operación exitosa">El producto fue guardado correctamente.</Alert>
          <Alert variant="warning" title="Atención">Este producto está por quedarse sin stock.</Alert>
          <Alert variant="danger"  title="Error">No se pudo conectar con el servidor. Intenta nuevamente.</Alert>
        </Preview>
      </Section>

      {/* ── 7. Cards ─────────────────────────────────────────────────────────── */}
      <Section title="Cards" description="3 variantes: default, elevated, interactive.">
        <Preview className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm font-medium text-lz-text">Default</p>
            <p className="mt-1 text-xs text-lz-muted">Superficie estándar sin elevación.</p>
          </Card>
          <Card variant="elevated">
            <p className="text-sm font-medium text-lz-text">Elevated</p>
            <p className="mt-1 text-xs text-lz-muted">Mayor jerarquía visual con sombra.</p>
          </Card>
          <Card variant="interactive">
            <p className="text-sm font-medium text-lz-text">Interactive</p>
            <p className="mt-1 text-xs text-lz-muted">Hover con borde primario. Clickeable.</p>
          </Card>
        </Preview>
        <Preview>
          <div className="rounded-xl border border-lz-border overflow-hidden">
            <CardHeader>
              <p className="text-sm font-semibold text-lz-text">Card con secciones</p>
              <Button size="sm" variant="ghost"><IconPlus size={14} /></Button>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-lz-muted">Contenido principal de la tarjeta usando CardHeader, CardBody y CardFooter.</p>
            </CardBody>
            <CardFooter>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm">Cancelar</Button>
                <Button size="sm">Guardar</Button>
              </div>
            </CardFooter>
          </div>
        </Preview>
      </Section>

      {/* ── 8. Tabla ─────────────────────────────────────────────────────────── */}
      <Section title="Tabla" description="Con estado vacío, hover por fila y scroll horizontal en móvil.">
        <Preview className="p-0 overflow-hidden">
          <Table
            columns={SAMPLE_COLUMNS}
            rows={SAMPLE_ROWS}
            keyExtractor={(row) => row.id}
          />
        </Preview>
        <Preview className="p-0 overflow-hidden">
          <Table
            columns={SAMPLE_COLUMNS}
            rows={[]}
            keyExtractor={(row: SampleRow) => row.id}
            emptyMessage="No hay productos disponibles"
          />
        </Preview>
      </Section>

      {/* ── 9. Empty state ───────────────────────────────────────────────────── */}
      <Section title="Empty State" description="Para módulos sin datos y primeras visitas.">
        <Preview>
          <EmptyState
            icon={<IconBox size={22} className="text-lz-muted" />}
            title="Sin productos"
            description="Comienza agregando tu primer producto al catálogo."
            action={<Button size="sm"><IconPlus size={14} />Agregar producto</Button>}
          />
        </Preview>
      </Section>

      {/* ── 10. Carga ────────────────────────────────────────────────────────── */}
      <Section title="Carga" description="Skeleton para placeholders y Spinner para procesos breves.">
        <Preview className="space-y-6">
          <div>
            <Label>Skeleton — texto y cards</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-lz-border bg-lz-surface p-5 space-y-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Skeleton — tabla</Label>
            <TableSkeleton rows={4} />
          </div>
          <div>
            <Label>Spinner — tamaños</Label>
            <div className="flex items-center gap-4">
              <Spinner size="sm" className="text-lz-primary" />
              <Spinner size="md" className="text-lz-primary" />
              <Spinner size="lg" className="text-lz-primary" />
              <Spinner size="sm" className="text-lz-muted" />
              <Spinner size="md" className="text-lz-success" />
              <Spinner size="md" className="text-lz-danger" />
            </div>
          </div>
        </Preview>
      </Section>

      {/* ── 11. Stat Cards ───────────────────────────────────────────────────── */}
      <Section title="Stat Cards" description="Para métricas del dashboard. Soporta trend y loading.">
        <Preview className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pedidos del día"
            value="48"
            icon={<IconCart size={18} />}
            trend={{ value: 12, label: 'vs ayer', up: true }}
          />
          <StatCard
            label="Ingresos del mes"
            value="$84,200"
            icon={<IconDollar size={18} />}
            trend={{ value: 3, label: 'vs anterior', up: false }}
          />
          <StatCard
            label="Productos activos"
            value="127"
            icon={<IconBox size={18} />}
            helperText="23 en revisión"
          />
          <StatCard
            label="Clientes nuevos"
            value="—"
            icon={<IconUsers size={18} />}
            loading
          />
        </Preview>
      </Section>

      {/* ── 12. Tooltip ──────────────────────────────────────────────────────── */}
      <Section title="Tooltip" description="Para contexto adicional discreto sobre elementos.">
        <Preview>
          <Row>
            <Tooltip content="Agregar producto al catálogo" side="top">
              <Button size="sm" variant="outline"><IconPlus size={14} />Tooltip arriba</Button>
            </Tooltip>
            <Tooltip content="Ver inventario actual" side="bottom">
              <Button size="sm" variant="ghost">Tooltip abajo</Button>
            </Tooltip>
            <Tooltip content="Información del sistema" side="right">
              <Button size="sm" variant="secondary">Tooltip derecha</Button>
            </Tooltip>
          </Row>
        </Preview>
      </Section>

      {/* ── 13. Interactivos (Modal + Toast) ─────────────────────────────────── */}
      <Section title="Interactivos" description="Modal y Toast requieren interacción del cliente.">
        <Preview>
          <InteractiveDemo />
        </Preview>
      </Section>

    </div>
  )
}
