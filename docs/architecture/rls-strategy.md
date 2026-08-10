# Estrategia de Row Level Security (RLS)

Define cómo se implementa el control de acceso a nivel de base de datos en Lanz Technology OS.

**Estado (Fase 2B):** RLS aplicado y activo en las 18 tablas públicas. Pruebas con usuario anónimo completadas. Pruebas con usuarios autenticados pendientes — ver `docs/testing/rls-test-matrix.md`.

---

## Modelo de permisos

El sistema usa un modelo **RBAC (Role-Based Access Control) con permisos granulares**:

```
Usuario ←N:N→ Roles ←N:N→ Permisos
```

- Un usuario puede tener múltiples roles.
- Cada rol tiene un conjunto de permisos.
- Los permisos son strings que identifican acciones concretas: `products.read`, `orders.cancel`.
- La función `has_permission('accion')` verifica si el usuario actual posee el permiso.

---

## Función auxiliar: has_permission()

```sql
CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid() AND p.name = p_permission
  );
$$;
```

**Por qué SECURITY DEFINER:**
Las tablas `user_roles` y `role_permissions` tienen RLS habilitado. Si `has_permission()` corriera con los permisos del llamante (`SECURITY INVOKER`), necesitaría una política de lectura en esas tablas para leerse a sí misma, creando recursión. `SECURITY DEFINER` evita la recursión ejecutando la función con privilegios del owner.

**Protección de search_path:**
El ataque de search_path injection puede hacer que una función busque objetos en esquemas controlados por el atacante. `SET search_path = public` elimina esta superficie de ataque.

---

## Funciones SECURITY DEFINER para escrituras restringidas

Tablas donde NO existen políticas INSERT/UPDATE/DELETE para usuarios normales:

| Tabla | Función | Motivo |
|---|---|---|
| `inventory_balances` | `record_inventory_movement()` | Atomicidad + validación anti-negativo |
| `inventory_movements` | `record_inventory_movement()` | Ledger inmutable — no writes directos |
| `audit_logs` | `log_audit_event()` | Append-only controlado desde Server Actions |
| `inventory_reservations` | Server Actions con service_role | Gestión via lógica de aplicación |

---

## Acceso por rol

### Administrator

| Operación | Acceso |
|---|---|
| Leer todos los perfiles | `has_permission('users.read')` |
| Gestionar usuarios | `has_permission('users.manage')` |
| Asignar roles | `has_permission('roles.assign')` |
| Leer productos y catálogo | `has_permission('products.read')` |
| Crear y editar productos | `has_permission('products.create/update')` |
| Publicar productos | `has_permission('products.publish')` (aplicado en app) |
| Leer inventario | `has_permission('inventory.read')` |
| Recibir inventario | `has_permission('inventory.receive')` |
| Ajustar inventario | `has_permission('inventory.adjust')` |
| Leer y gestionar pedidos | `has_permission('orders.read/update/cancel')` |
| Ver costos en pedidos | `has_permission('orders.view_cost')` |
| Leer y gestionar clientes | `has_permission('customers.read/create/update')` |
| Ver costos de productos | `has_permission('finance.read_costs')` |
| Ver rentabilidad | `has_permission('finance.read_profitability')` |
| Leer auditoría | `has_permission('audit.read')` |
| Gestionar configuración | `has_permission('settings.manage')` |

### Salesperson

| Operación | Acceso |
|---|---|
| Leer catálogo | `has_permission('products.read')` |
| Leer inventario | `has_permission('inventory.read')` |
| Reservar inventario | `has_permission('inventory.reserve')` |
| Leer y crear pedidos | `has_permission('orders.read/create/update')` |
| Leer y gestionar clientes | `has_permission('customers.read/create/update')` |
| Ver costos en pedidos | **NO** — sin `orders.view_cost` |
| Ver costos de productos | **NO** — sin `finance.read_costs` |
| Leer auditoría | **NO** |
| Gestionar configuración | **NO** |

---

## Protección de costos y rentabilidad

PostgreSQL no soporta políticas RLS por columna. La protección de los campos `reference_cost` (products) y `unit_cost` (order_items) se implementa en la capa de aplicación:

1. Los Server Actions que devuelven datos de productos verifican `has_permission('finance.read_costs')` y omiten `reference_cost` si el usuario no lo tiene.
2. Los Server Actions que devuelven ítems de pedido verifican `has_permission('orders.view_cost')` y omiten `unit_cost` si el usuario no lo tiene.
3. Los tipos TypeScript de respuesta tienen variantes con y sin campos de costo.

**Riesgo residual**: Un usuario con acceso de BD directo (servicio externo) podría ver estos campos. La mitigación es restringir el acceso de BD solo a la aplicación via service_role y anon_key.

---

## Inventario: protección de escritura directa

```
Política RLS en inventory_balances:
  SELECT: has_permission('inventory.read')
  INSERT: SIN POLÍTICA (bloqueado)
  UPDATE: SIN POLÍTICA (bloqueado)
  DELETE: SIN POLÍTICA (bloqueado)
```

Las escrituras solo ocurren via `record_inventory_movement()` que tiene `SECURITY DEFINER`. La función:
1. Verifica el permiso del llamante antes de ejecutar
2. Bloquea la fila con `FOR UPDATE`
3. Valida que el saldo no quede negativo
4. Inserta el movimiento y actualiza el saldo atómicamente

---

## Pedidos: inmutabilidad de historial

```
order_items:
  INSERT: has_permission('orders.create')
  UPDATE: SIN POLÍTICA (bloqueado)
  DELETE: SIN POLÍTICA (bloqueado)

order_status_history:
  INSERT: has_permission('orders.update') OR has_permission('orders.cancel')
  UPDATE: SIN POLÍTICA (bloqueado)
  DELETE: SIN POLÍTICA (bloqueado)
```

---

## Auditoría: solo lectura para admin

```
audit_logs:
  SELECT: has_permission('audit.read')
  INSERT: SIN POLÍTICA (solo via log_audit_event())
  UPDATE: SIN POLÍTICA
  DELETE: SIN POLÍTICA
```

---

## Acceso anónimo futuro (tienda pública)

Cuando se implemente la tienda pública, los productos publicados serán accesibles sin autenticación:

```sql
-- Política futura para tienda pública (Fase 5)
CREATE POLICY "products_public_store" ON products
  FOR SELECT TO anon
  USING (status = 'active' AND is_published = true);
```

Esta política NO existe actualmente. Agregar en la migración correspondiente a la Fase 5.

---

## Riesgos identificados

| Riesgo | Nivel | Mitigación |
|---|---|---|
| Protección de costos es a nivel de aplicación | Medio | Revisión de código + pruebas de permisos en Fase 3 |
| Recursión de RLS en has_permission() | Controlado | SECURITY DEFINER evita la recursión |
| Permisos incorrectos en seed si roles cambian | Bajo | Idempotencia con ON CONFLICT DO NOTHING |
| RLS no protege acceso via service_role | Informativo | service_role solo en servidor; nunca en cliente |

---

## Matriz de acceso por tabla

| Tabla | anon | salesperson | administrator | service_role |
|---|---|---|---|---|
| `profiles` | — | propio | todos | todos |
| `roles` | — | lectura | lectura | todos |
| `permissions` | — | lectura | lectura | todos |
| `categories` | — | lectura | CRUD | todos |
| `products` | — (futuro: publicados) | lectura | CRUD | todos |
| `product_images` | — | lectura | CRUD | todos |
| `inventory_balances` | — | lectura | lectura | todos |
| `inventory_movements` | — | lectura | lectura | todos (via función) |
| `customers` | — | CRUD | CRUD | todos |
| `orders` | — | CRU | CRUD | todos |
| `order_items` | — | CR | CR | todos |
| `order_status_history` | — | CR | CR | todos |
| `audit_logs` | — | — | lectura | todos |
| `business_settings` | — | — | CRUD | todos |
