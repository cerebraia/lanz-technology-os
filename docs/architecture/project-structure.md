# Estructura del proyecto

Define la estructura real actual y la estructura prevista a medida que el sistema crece.

---

## Estructura actual (Fase 1)

```
lanz-technology-os/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── docs/
│   ├── PROJECT-BIBLE.md
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── domain-map.md
│   │   ├── layering-and-boundaries.md
│   │   ├── project-structure.md        ← este archivo
│   │   └── security-principles.md
│   ├── business/
│   │   ├── roles-and-permissions.md
│   │   ├── inventory-principles.md
│   │   ├── imports-overview.md
│   │   └── marketing-overview.md
│   ├── conventions/
│   │   ├── code-conventions.md
│   │   └── ui-conventions.md
│   ├── decisions/
│   │   ├── ADR-001-technology-stack.md
│   │   └── ADR-002-modular-monolith.md
│   ├── roadmap/
│   │   └── product-roadmap.md
│   └── testing/
│       └── testing-strategy.md
├── public/
│   └── favicon.ico
├── supabase/
│   └── migrations/
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Estructura prevista (completa)

Se construirá progresivamente. Las carpetas se crean cuando el módulo que las necesita se implementa.

```
lanz-technology-os/
├── app/
│   ├── (store)/                    # Grupo de rutas — Tienda pública
│   │   ├── layout.tsx              # Layout de la tienda
│   │   ├── page.tsx                # Home de la tienda
│   │   ├── productos/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── pedido/
│   │       └── page.tsx
│   ├── (admin)/                    # Grupo de rutas — Centro de operaciones
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── productos/page.tsx
│   │   ├── inventario/page.tsx
│   │   ├── pedidos/page.tsx
│   │   ├── clientes/page.tsx
│   │   ├── importaciones/page.tsx
│   │   ├── finanzas/page.tsx
│   │   ├── marketing/page.tsx
│   │   ├── reportes/page.tsx
│   │   ├── usuarios/page.tsx
│   │   ├── auditoria/page.tsx
│   │   └── configuracion/page.tsx
│   ├── api/                        # Route Handlers internos
│   ├── globals.css
│   ├── layout.tsx                  # RootLayout
│   └── page.tsx                    # Página temporal / redirección
│
├── components/
│   ├── ui/                         # Primitivos de UI reutilizables
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   └── shared/                     # Componentes compartidos de negocio
│       ├── data-table.tsx
│       ├── page-header.tsx
│       └── ...
│
├── features/                       # Dominios de negocio
│   ├── auth/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── catalog/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── data/
│   │   ├── domain/
│   │   └── types.ts
│   ├── inventory/
│   ├── sales/
│   ├── crm/
│   ├── purchasing/
│   ├── imports/
│   ├── finance/
│   ├── marketing/
│   ├── reports/
│   ├── audit/
│   └── settings/
│
├── lib/
│   ├── db/                         # Cliente de Supabase y helpers de datos
│   ├── format/                     # Formateo de fechas, moneda, etc.
│   ├── validation/                 # Esquemas de validación compartidos
│   └── utils/                      # Utilidades generales
│
├── config/
│   └── site.ts                     # Constantes del sitio (nombre, URL, etc.)
│
├── types/
│   └── index.ts                    # Tipos compartidos entre dominios
│
├── docs/                           # Documentación del proyecto
├── public/                         # Activos estáticos
├── supabase/
│   └── migrations/                 # Migraciones SQL ordenadas cronológicamente
│
└── [archivos de configuración raíz]
```

---

## Propósito de cada carpeta

### `app/`

Router de Next.js. Solo contiene:
- Layouts y páginas (archivos de convención de Next.js)
- Grupos de rutas para separar tienda y admin
- Route Handlers (`api/`) para endpoints internos

**No debe contener:** lógica de negocio, queries a base de datos, componentes reutilizables.

---

### `components/`

Componentes React reutilizables sin lógica de dominio específico.

- `ui/`: primitivos visuales (botones, inputs, badges, modales). Sin conocimiento de negocio.
- `shared/`: componentes de negocio transversal (tabla de datos, encabezado de página).

**No debe contener:** lógica de dominio, acceso a datos, Server Actions.

---

### `features/`

Cada subdirectorio es un dominio de negocio. Estructura interna por dominio:

```
features/<dominio>/
├── actions/     # Server Actions (mutaciones)
├── components/  # Componentes específicos del dominio
├── data/        # Queries y repositorios de datos
├── domain/      # Reglas de negocio puras
├── hooks/       # React hooks del dominio
└── types.ts     # Tipos del dominio
```

**Regla:** Un dominio nunca importa desde la carpeta interna de otro dominio.

---

### `lib/`

Utilidades y código de infraestructura compartido que no pertenece a ningún dominio específico.

- `db/`: cliente Supabase y funciones de acceso a datos reutilizables.
- `format/`: formateo de números, fechas, moneda (bolivares / dólares).
- `validation/`: esquemas de validación (Zod u otro cuando se incorpore).
- `utils/`: funciones puras de propósito general.

---

### `config/`

Constantes y configuración del sitio que no son secretos.

Ejemplo: nombre del sitio, URL base, configuración de metadatos por defecto.

---

### `types/`

Tipos TypeScript compartidos entre múltiples dominios. Si un tipo solo lo usa un dominio, vive en `features/<dominio>/types.ts`.

---

### `docs/`

Toda la documentación del proyecto. Organizada por categoría. Ver índice en `docs/PROJECT-BIBLE.md`.

---

### `public/`

Activos estáticos servidos directamente. Imágenes de marca, favicon, iconos.

---

### `supabase/migrations/`

Migraciones de base de datos SQL ordenadas cronológicamente. Se crearán en la Fase 2.

---

## Dónde colocar cada tipo de archivo

| ¿Qué es? | ¿Dónde va? |
|---|---|
| Página o layout de Next.js | `app/` |
| Componente visual sin lógica de negocio | `components/ui/` |
| Componente compartido con algo de lógica presentacional | `components/shared/` |
| Componente específico de un dominio | `features/<dominio>/components/` |
| Server Action | `features/<dominio>/actions/` |
| Query a Supabase | `features/<dominio>/data/` |
| Regla de negocio pura | `features/<dominio>/domain/` |
| Hook de React de un dominio | `features/<dominio>/hooks/` |
| Tipo de un solo dominio | `features/<dominio>/types.ts` |
| Tipo compartido entre dominios | `types/` |
| Utilidad compartida | `lib/` |
| Constante del sitio | `config/site.ts` |
| Migración de base de datos | `supabase/migrations/` |
| Documentación | `docs/` |

---

## Qué NO debe colocarse en cada carpeta

| Carpeta | Prohibido |
|---|---|
| `app/` | Lógica de negocio, queries directas, componentes reutilizables |
| `components/ui/` | Conocimiento de dominio, llamadas a API |
| `features/<dominio>/` | Importaciones de otros dominios internos |
| `lib/` | Lógica de dominio específico |
| `types/` | Tipos que solo usa un dominio |
| `config/` | Secretos o valores de entorno |
| `public/` | Archivos con información sensible |
