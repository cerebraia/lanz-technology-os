# Roles y permisos

Define los roles iniciales del sistema y los permisos asociados a cada uno.

**Estado: No implementado.** Este documento es la referencia de diseño para la Fase 3.

---

## Modelo de autorización

Los roles son **agrupaciones de permisos**. No son categorías fijas e inamovibles.

La autorización se verifica **por acción**, no solo por acceso a una página. Esto significa que:

1. Una página protegida con middleware no garantiza que todas las operaciones dentro de esa página estén permitidas.
2. Cada Server Action o endpoint verifica de forma independiente si el usuario tiene el permiso requerido.
3. Un usuario puede tener permisos adicionales o restringidos respecto a los de su rol base.

---

## Roles iniciales

### Administrator

Acceso completo al sistema. Puede realizar todas las operaciones disponibles.

**Puede:**
- Administrar usuarios (crear, editar, desactivar)
- Asignar roles y permisos individuales
- Ver costos de productos e importaciones
- Ver rentabilidad por producto y período
- Gestionar el catálogo de productos y categorías
- Gestionar inventario y aprobar ajustes
- Gestionar pedidos en todos sus estados
- Gestionar registros financieros
- Gestionar importaciones
- Gestionar campañas de marketing
- Consultar todos los reportes
- Consultar el log de auditoría
- Modificar configuraciones del negocio

---

### Salesperson

Acceso operativo orientado al proceso de ventas y atención al cliente.

**Puede:**
- Consultar el catálogo de productos (sin costos)
- Consultar disponibilidad de inventario
- Crear y gestionar pedidos dentro de los permisos autorizados
- Actualizar el estado de pedidos dentro de lo permitido
- Registrar y editar clientes
- Añadir notas de seguimiento en clientes y pedidos
- Registrar movimientos de inventario autorizados
- Solicitar ajustes de inventario (sujetos a aprobación)
- Consultar información comercial necesaria para su función

**No puede:**
- Administrar usuarios ni asignar permisos
- Ver costos de productos ni márgenes
- Ver rentabilidad completa del negocio
- Eliminar movimientos de inventario
- Cancelar pedidos por encima de un monto configurable (sujeto a aprobación)
- Cambiar configuraciones sensibles del negocio
- Confirmar operaciones financieras restringidas
- Acceder ni modificar el log de auditoría
- Eliminar historial de pedidos o registros financieros

---

## Permisos por acción (referencia)

La tabla siguiente es una referencia inicial. Los permisos exactos se definirán al implementar cada módulo.

| Permiso | Administrator | Salesperson |
|---|---|---|
| `users:create` | ✅ | ❌ |
| `users:edit` | ✅ | ❌ |
| `users:deactivate` | ✅ | ❌ |
| `roles:assign` | ✅ | ❌ |
| `catalog:view` | ✅ | ✅ |
| `catalog:edit` | ✅ | ❌ |
| `catalog:view_cost` | ✅ | ❌ |
| `inventory:view` | ✅ | ✅ |
| `inventory:movement` | ✅ | ✅ (restringido) |
| `inventory:adjust` | ✅ | ❌ (requiere solicitud) |
| `orders:create` | ✅ | ✅ |
| `orders:edit` | ✅ | ✅ (restringido) |
| `orders:cancel` | ✅ | ❌ (requiere aprobación) |
| `orders:view_cost` | ✅ | ❌ |
| `crm:view` | ✅ | ✅ |
| `crm:create` | ✅ | ✅ |
| `finance:view` | ✅ | ❌ |
| `finance:create` | ✅ | ❌ |
| `imports:view` | ✅ | ❌ |
| `imports:manage` | ✅ | ❌ |
| `marketing:view` | ✅ | ❌ |
| `marketing:manage` | ✅ | ❌ |
| `reports:view` | ✅ | ❌ (reportes básicos) |
| `audit:view` | ✅ | ❌ |
| `settings:edit` | ✅ | ❌ |

---

## Roles futuros previstos

A medida que el negocio crezca, podrán añadirse roles adicionales como:

- **Warehouse Operator** — gestión de inventario sin acceso a ventas.
- **Finance Manager** — acceso a finanzas sin gestión de usuarios.
- **Customer Support** — gestión de pedidos y clientes sin acceso a finanzas.

Los roles futuros se definirán cuando exista una necesidad operativa real.

---

## Notas de implementación

- La verificación de permisos se implementará en la Fase 3.
- Los permisos se almacenarán en la base de datos y se verificarán en el servidor.
- No se usarán roles hardcodeados en el código; siempre se consultará la base de datos.
- El sistema de permisos debe ser extensible sin modificar código de negocio.
