# ADR-005 — Modelo de roles y permisos por acción

**Fecha:** 2026-07-29
**Estado:** Aceptado
**Autores:** Lanz Technology

---

## Contexto

Lanz Technology OS tiene usuarios internos con diferentes responsabilidades. Es necesario controlar qué puede hacer cada usuario en el sistema. Los modelos de autorización más comunes son:

- **Role-only**: el usuario tiene un rol (`admin` o `user`) y el código verifica el rol.
- **RBAC (Role-Based Access Control)**: los roles agrupan permisos granulares.
- **ABAC (Attribute-Based Access Control)**: permisos según atributos del usuario, recurso y contexto.

---

## Decisión

Implementar **RBAC con permisos por acción** (`Permission-Based RBAC`):

- Los permisos son strings que identifican acciones concretas: `products.read`, `orders.cancel`.
- Los roles son agrupaciones nombradas de permisos.
- Un usuario puede tener múltiples roles.
- La verificación de autorización se hace por permiso, no por nombre de rol.

---

## Estructura

```
profiles ←(user_roles)→ roles ←(role_permissions)→ permissions
```

### Por qué no verificar el nombre del rol directamente

```typescript
// MAL: verificar por nombre de rol
if (user.role === 'administrator') { ... }

// BIEN: verificar por permiso
if (await hasPermission('orders.cancel')) { ... }
```

Verificar por nombre de rol acopla el código al nombre exacto del rol. Si en el futuro se agrega un rol intermedio (ej. `manager`) que también debería cancelar pedidos, habría que modificar el código en múltiples lugares.

Verificar por permiso es estable: el código siempre verifica `orders.cancel` y la asignación de ese permiso al nuevo rol se hace en la base de datos.

---

## Convención de nombres de permisos

Formato: `dominio.accion` en snake_case inglés.

```
products.read
products.create
products.update
products.publish

inventory.read
inventory.receive
inventory.reserve
inventory.adjust

orders.read
orders.create
orders.update
orders.cancel
orders.view_cost

finance.read_costs
finance.read_profitability

users.read
users.manage
roles.assign

settings.read
settings.manage
audit.read
```

---

## Roles iniciales y sus permisos

### Administrator

Tiene todos los permisos definidos. Asignado en el seed via `CROSS JOIN` entre el rol y todos los permisos.

### Salesperson

Permisos operativos sin acceso a costos, finanzas, usuarios ni auditoría:
- `products.read`
- `inventory.read`, `inventory.reserve`
- `orders.read`, `orders.create`, `orders.update`
- `customers.read`, `customers.create`, `customers.update`

---

## Implementación en Next.js

La verificación ocurre en Server Actions antes de ejecutar cualquier operación sensible:

```typescript
// features/orders/actions/cancel-order.ts
'use server'

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: hasPermission } = await supabase
    .rpc('has_permission', { p_permission: 'orders.cancel' })

  if (!hasPermission) throw new Error('Sin permiso para cancelar pedidos')

  // ... continuar con la cancelación
}
```

---

## Función has_permission() en PostgreSQL

La función verifica si el usuario JWT actual (`auth.uid()`) tiene el permiso indicado consultando las tablas de autorización:

```sql
SELECT has_permission('orders.cancel')  -- → boolean
```

Usada en:
1. Server Actions (verificación explícita).
2. Políticas RLS (verificación automática en base de datos).

---

## Ventajas del modelo

1. **Extensible**: agregar un nuevo permiso no requiere cambiar código, solo el seed.
2. **Granular**: se puede conceder o revocar un permiso individual a un rol.
3. **Auditable**: los cambios de permisos quedan en `audit_logs`.
4. **Verificable**: las pruebas de permisos prueban permisos específicos, no nombres de roles.
5. **Coherente entre app y base de datos**: la misma lógica en Server Actions y RLS.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Nombres de permisos hardcodeados en código | Centralizar en un archivo de constantes en `config/permissions.ts` (Fase 3) |
| Permiso mal escrito en el código | TypeScript con un tipo `Permission` que enumere los permisos válidos |
| Rendimiento de has_permission() en RLS | Función STABLE + caché de plan; índices en user_roles y role_permissions |
| Proliferación de roles y permisos | Revisión periódica; evitar permisos especulativos |

---

## Consecuencias

- Nunca verificar `user.role === 'administrator'` en el código de aplicación.
- Siempre verificar `hasPermission('accion.concreta')`.
- Los permisos se definen en el seed y se documentan en `docs/business/roles-and-permissions.md`.
- Agregar nuevos permisos requiere una nueva migración de seed y actualizar la documentación.
