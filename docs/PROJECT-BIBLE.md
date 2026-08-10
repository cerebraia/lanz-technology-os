# Lanz Technology OS — Project Bible

Documento maestro del producto. Define la identidad, visión, filosofía y alcance del sistema.

---

## Identidad

**Empresa:** Lanz Technology  
**Plataforma:** Lanz Technology OS  
**País:** Venezuela  
**Sector:** Comercialización de productos DJI y tecnología premium

### Qué es Lanz Technology OS

Una plataforma integrada compuesta por dos superficies principales:

1. **Tienda pública** — canal de ventas online orientado a clientes finales.
2. **Centro de operaciones** — sistema interno para gestión de inventario, pedidos, importaciones, finanzas, marketing, clientes, usuarios y configuración del negocio.

No es únicamente una tienda online. Es el sistema operativo de la empresa.

---

## Visión

Centralizar todas las operaciones relevantes de Lanz Technology en una sola plataforma integrada, eliminando herramientas dispersas, reduciendo errores manuales, aumentando la visibilidad del negocio y mejorando la capacidad de tomar decisiones informadas.

---

## Objetivos estratégicos

1. Simplificar el proceso de ventas desde cotización hasta despacho.
2. Controlar el inventario con trazabilidad completa de movimientos.
3. Gestionar pedidos en todos sus estados.
4. Controlar el ciclo de importaciones desde la orden de compra hasta la recepción.
5. Registrar ingresos, gastos y medir rentabilidad por producto y período.
6. Controlar la inversión publicitaria y atribuir resultados de marketing.
7. Gestionar la relación con clientes actuales y potenciales.
8. Administrar usuarios internos con roles y permisos granulares.
9. Generar información confiable para la toma de decisiones estratégicas.
10. Escalar la plataforma sin reescribir la base.

---

## Filosofía del producto

| Principio | Descripción |
|---|---|
| **Premium** | La experiencia visual y funcional debe estar a la altura de los productos que vende Lanz Technology. |
| **Minimalista** | Cada elemento en pantalla debe tener un propósito. Sin ruido visual. |
| **Rápida** | Las operaciones frecuentes deben completarse con el menor número de pasos posible. |
| **Segura** | Los datos sensibles, costos y rentabilidad son información restringida. |
| **Profesional** | Lenguaje, diseño y flujos orientados a usuarios internos competentes. |
| **Mobile-first** | El operador debe poder gestionar el negocio desde cualquier dispositivo. |
| **Escalable progresivamente** | La arquitectura permite crecer sin reescribir lo que ya funciona. |

---

## Principios de producto

- Menos es más. Cada funcionalidad debe tener impacto operativo o comercial claro.
- No desarrollar funciones innecesarias para la etapa actual del negocio.
- Mantener los módulos conectados; evitar silos de información.
- Evitar duplicación de datos entre módulos.
- Priorizar rentabilidad, trazabilidad y simplicidad operativa.
- Una funcionalidad bien implementada vale más que tres a medias.

---

## Alcance funcional previsto

Los siguientes módulos están planificados pero **no implementados**. Se desarrollarán progresivamente según el roadmap.

| Módulo | Descripción |
|---|---|
| **Auth** | Autenticación, sesiones y recuperación de acceso |
| **Users** | Perfiles internos y estado de usuarios |
| **Catalog** | Productos, categorías, precios e imágenes |
| **Inventory** | Existencias, movimientos, reservas y alertas |
| **Sales** | Carrito, pedidos y estados |
| **CRM** | Clientes, contactos y seguimiento |
| **Purchasing** | Proveedores y órdenes de compra |
| **Imports** | Importaciones, tránsito y recepción |
| **Finance** | Ingresos, gastos, flujo de caja y rentabilidad |
| **Marketing** | Campañas, inversión publicitaria y atribución |
| **Reports** | Indicadores y reportes operativos |
| **Audit** | Trazabilidad de operaciones sensibles |
| **Settings** | Configuración general del negocio |

---

## Roles iniciales previstos

### Administrator

Acceso completo al sistema, incluyendo costos, rentabilidad, configuración y administración de usuarios.

### Salesperson

Acceso operativo: productos, pedidos, clientes y movimientos autorizados de inventario. Sin acceso a costos restringidos ni configuraciones sensibles.

> La autorización futura será por permisos individuales asignados a roles. Los roles son agrupaciones de permisos, no categorías fijas e inamovibles. Consultar [`docs/business/roles-and-permissions.md`](business/roles-and-permissions.md).

---

## Roadmap resumido

| Fase | Nombre | Estado |
|---|---|---|
| 1 | Fundación arquitectónica y documental | **Activa** |
| 2 | Modelo físico de datos y Supabase | Pendiente |
| 3 | Autenticación, usuarios y permisos | Pendiente |
| 4 | Catálogo de productos | Pendiente |
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

Consultar [`docs/roadmap/product-roadmap.md`](roadmap/product-roadmap.md) para el detalle completo de cada fase.

---

## Referencias

- Arquitectura general: [`docs/architecture/system-overview.md`](architecture/system-overview.md)
- Dominios: [`docs/architecture/domain-map.md`](architecture/domain-map.md)
- Convenciones de código: [`docs/conventions/code-conventions.md`](conventions/code-conventions.md)
- Decisiones arquitectónicas: [`docs/decisions/`](decisions/)
- Reglas para Claude Code: [`CLAUDE.md`](../CLAUDE.md)
