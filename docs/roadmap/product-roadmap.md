# Roadmap del producto

Define las fases de desarrollo de Lanz Technology OS con sus objetivos, dependencias, entregables y criterios de finalización.

---

## Estado global

| Fase | Nombre | Estado |
|---|---|---|
| **1** | Fundación arquitectónica y documental | **Activa** |
| 2 | Modelo físico de datos y Supabase | Pendiente |
| 3 | Autenticación, usuarios y permisos | Pendiente |
| 4 | Catálogo: categorías, productos, imágenes y precios | Pendiente |
| 5 | Tienda pública | Pendiente |
| 6 | Clientes, carrito y pedidos | Pendiente |
| 7 | Inventario | Pendiente |
| 8 | Pagos y finanzas básicas | Pendiente |
| 9 | Dashboard operativo | Pendiente |
| 10 | Proveedores y compras | Pendiente |
| 11 | Importaciones | Pendiente |
| 12 | Marketing | Pendiente |
| 13 | Reportes | Pendiente |
| 14 | CRM avanzado | Pendiente |
| 15 | Automatizaciones e inteligencia estratégica | Pendiente |

---

## Fase 1 — Fundación arquitectónica y documental

**Estado: Activa**

### Objetivo

Establecer la base técnica, documental y arquitectónica sobre la que se construirá el sistema completo.

### Dependencias

Ninguna. Es la fase inicial.

### Entregables

- Proyecto Next.js 16 configurado con TypeScript, Tailwind CSS v4 y ESLint
- Estructura de carpetas documentada
- Página de inicio temporal limpia y profesional
- CLAUDE.md con reglas operativas para Claude Code
- AGENTS.md con guía para agentes automatizados
- README.md completo y coherente con el estado real
- Project Bible (`docs/PROJECT-BIBLE.md`)
- Documentación de arquitectura (system-overview, domain-map, layering, project-structure, security-principles)
- Documentación de negocio (roles, inventario, importaciones, marketing)
- Convenciones de código y UI
- ADR-001 y ADR-002
- `.env.example`
- Scripts `lint`, `typecheck` y `build` funcionando sin errores

### Criterio de finalización

- `npm run lint` sin errores
- `npm run typecheck` sin errores
- `npm run build` exitoso
- Documentación completa y coherente con los archivos reales
- Sin código de negocio implementado

---

## Fase 2 — Modelo físico de datos y Supabase

**Estado: Pendiente**

### Objetivo

Diseñar el esquema de base de datos para los primeros módulos y configurar la integración con Supabase.

### Dependencias

Fase 1 completada.

### Entregables

- Proyecto Supabase creado y configurado
- Variables de entorno configuradas en `.env.local`
- Cliente de Supabase en `lib/db/`
- Esquema inicial de tablas: users, products, categories, inventory_movements
- Migraciones SQL en `supabase/migrations/`
- RLS habilitado en todas las tablas
- Tipos de TypeScript generados desde el esquema

### Criterio de finalización

- Conexión a Supabase verificada
- Tablas creadas con RLS activo
- Tipos de TypeScript sincronizados con el esquema
- Migraciones versionadas en el repositorio

---

## Fase 3 — Autenticación, usuarios y permisos

**Estado: Pendiente**

### Objetivo

Proteger el centro de operaciones con autenticación y un sistema de permisos por acción.

### Dependencias

Fase 2 completada (Supabase Auth requiere base de datos configurada).

### Entregables

- Login y logout con Supabase Auth
- Protección de rutas del admin con middleware de Next.js
- Tabla de usuarios con roles y permisos
- Verificación de permisos en Server Actions
- Sesión de usuario disponible en Server Components
- Página de login del centro de operaciones

### Criterio de finalización

- Rutas del admin inaccesibles sin sesión activa
- Los permisos se verifican en servidor antes de cada operación
- Un usuario sin permiso no puede ejecutar la acción, aunque acceda a la URL

---

## Fase 4 — Catálogo: categorías, productos, imágenes y precios

**Estado: Pendiente**

### Objetivo

Gestionar el catálogo de productos con categorías, imágenes y precios de venta.

### Dependencias

Fase 3 completada (se requiere autenticación para administrar el catálogo).

### Entregables

- CRUD de categorías en el admin
- CRUD de productos con: nombre, descripción, SKU, precio, imágenes, estado
- Subida de imágenes a Supabase Storage
- Gestión de estado de publicación (borrador / publicado)
- Tipos de TypeScript del dominio catalog

### Criterio de finalización

- Se pueden crear, editar y archivar productos y categorías
- Las imágenes se almacenan correctamente
- Los productos tienen precio de venta y estado de publicación

---

## Fase 5 — Tienda pública

**Estado: Pendiente**

### Objetivo

Publicar la tienda online accesible para clientes, con catálogo, detalle de producto y canal de contacto.

### Dependencias

Fase 4 completada (requiere catálogo con productos publicados).

### Entregables

- Página de inicio de la tienda
- Listado de productos con filtros por categoría
- Página de detalle de producto
- Diseño responsive y mobile-first
- SEO básico: metadata, Open Graph
- Canal de contacto por WhatsApp

### Criterio de finalización

- La tienda es accesible públicamente
- Los productos publicados son visibles
- El SEO básico está configurado
- El canal de WhatsApp funciona

---

## Fase 6 — Clientes, carrito y pedidos

**Estado: Pendiente**

### Objetivo

Permitir la creación y gestión de pedidos, tanto desde la tienda pública como desde el admin.

### Dependencias

Fase 5 completada (tienda pública para pedidos online) y Fase 3 (admin para pedidos internos).

### Entregables

- Carrito de compra en la tienda pública
- Flujo de checkout con registro de cliente
- Creación de pedidos en el admin (venta directa)
- Gestión de estados de pedido
- Notificación al cliente (WhatsApp o email básico)
- Registro de clientes en CRM básico

### Criterio de finalización

- Se pueden crear pedidos desde la tienda y desde el admin
- Los pedidos tienen estados y flujo definido
- Los clientes quedan registrados

---

## Fase 7 — Inventario

**Estado: Pendiente**

### Objetivo

Implementar el control de inventario con movimientos, reservas y trazabilidad completa.

### Dependencias

Fase 6 completada (los pedidos generan movimientos de inventario).

### Entregables

- Saldo de inventario por producto
- Movimientos automáticos al confirmar y despachar pedidos
- Movimientos manuales con permiso
- Ajustes de inventario con aprobación
- Alertas de stock mínimo
- Historial completo de movimientos

### Criterio de finalización

- El stock refleja la realidad de movimientos
- No hay edición directa de stock
- Los movimientos quedan registrados con usuario y motivo

---

## Fase 8 — Pagos y finanzas básicas

**Estado: Pendiente**

### Objetivo

Registrar ingresos de pedidos, gastos operativos y visualizar el flujo de caja básico.

### Dependencias

Fase 6 y Fase 7 completadas.

### Entregables

- Registro de pagos asociados a pedidos
- Registro de gastos generales
- Flujo de caja por período
- Rentabilidad básica por producto
- Acceso restringido a información de costos

### Criterio de finalización

- Los ingresos y gastos quedan registrados
- El flujo de caja es visible para administradores
- Los costos están protegidos de usuarios sin permiso

---

## Fase 9 — Dashboard operativo

**Estado: Pendiente**

### Objetivo

Proveer un dashboard con los indicadores más importantes para la operación diaria.

### Dependencias

Fases 6, 7 y 8 completadas.

### Entregables

- Dashboard del administrador: pedidos del día, stock crítico, ingresos del mes
- Dashboard del vendedor: pedidos activos, clientes recientes
- KPIs básicos accionables

### Criterio de finalización

- El dashboard carga rápido
- Los datos son precisos y actualizados
- El acceso es diferenciado por rol

---

## Fase 10 — Proveedores y compras

**Estado: Pendiente**

### Objetivo

Gestionar proveedores y órdenes de compra locales.

### Dependencias

Fase 7 y Fase 8 completadas.

### Entregables

- CRUD de proveedores
- Órdenes de compra con líneas de producto y precios de costo
- Recepción de órdenes que genera entradas de inventario
- Registro de gasto en finanzas al recibir

### Criterio de finalización

- Se pueden registrar compras locales
- La recepción actualiza el inventario
- El gasto queda registrado en finanzas

---

## Fase 11 — Importaciones

**Estado: Pendiente**

### Objetivo

Controlar el ciclo completo de importaciones internacionales con trazabilidad de estado y capital.

### Dependencias

Fase 10 completada.

### Entregables

- Registro de importaciones con todos sus estados
- Gastos de importación distribuidos entre productos
- Inventario en tránsito diferenciado
- Recepción con registro de faltantes y daños
- Capital comprometido visible

### Criterio de finalización

- El ciclo completo de importación es rastreable
- Al cerrar, el inventario se actualiza y los costos se registran
- Ver [`docs/business/imports-overview.md`](../business/imports-overview.md) para definición completa

---

## Fase 12 — Marketing

**Estado: Pendiente**

### Objetivo

Registrar y medir la inversión publicitaria con atribución de pedidos.

### Dependencias

Fase 6 (pedidos con fuente de atribución) y Fase 8 (gastos en finanzas).

### Entregables

- Registro de campañas y gastos publicitarios
- Atribución manual de pedidos a campañas
- Métricas: costo por pedido, ROAS, rentabilidad post-publicidad

### Criterio de finalización

- Las campañas tienen gasto y pedidos atribuidos
- Las métricas son correctas y de acceso restringido

---

## Fase 13 — Reportes

**Estado: Pendiente**

### Objetivo

Generar reportes operativos y estratégicos que soporten la toma de decisiones.

### Dependencias

Todas las fases operativas completadas.

### Entregables

- Reportes de ventas por período, producto y canal
- Reportes de inventario y rotación
- Reportes financieros básicos
- Exportación a CSV

### Criterio de finalización

- Los reportes son precisos y de acceso restringido
- Los datos pueden exportarse

---

## Fase 14 — CRM avanzado

**Estado: Pendiente**

### Objetivo

Extender el módulo de clientes con seguimiento activo y comunicación.

### Dependencias

Fase 6 completada.

### Entregables

- Historial completo de interacciones por cliente
- Notas y tareas de seguimiento
- Segmentación básica de clientes
- Integración básica con WhatsApp (registro de conversaciones)

### Criterio de finalización

- El historial del cliente es completo y utilizable
- El equipo de ventas puede gestionar el seguimiento desde la plataforma

---

## Fase 15 — Automatizaciones e inteligencia estratégica

**Estado: Pendiente**

### Objetivo

Incorporar automatizaciones operativas e inteligencia basada en datos históricos.

### Dependencias

Todas las fases previas completadas con datos suficientes.

### Entregables

- Alertas automáticas de reabastecimiento
- Predicción básica de demanda
- Sugerencias de precios basadas en historial
- Automatizaciones de notificación de pedidos
- Integraciones futuras con IA (a definir)

### Criterio de finalización

- Al menos una automatización operativa en producción
- El equipo usa la inteligencia para tomar decisiones

---

## Principios del roadmap

- Las fases son secuenciales; cada una depende de la anterior.
- No iniciar una fase sin completar los criterios de la anterior.
- El alcance de cada fase puede ajustarse según prioridades del negocio.
- Nuevas fases pueden insertarse si surgen necesidades no anticipadas.
- La documentación se actualiza junto con el código.
