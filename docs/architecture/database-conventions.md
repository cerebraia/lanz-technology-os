# Convenciones de base de datos

Define los estándares que rigen el diseño del esquema de Lanz Technology OS.

---

## Identificadores

- Todas las claves primarias son **UUID** generados con `gen_random_uuid()`.
- No usar enteros auto-incrementales como claves primarias de entidades de negocio.
- Las claves foráneas tienen el nombre de la tabla referenciada seguido de `_id`: `product_id`, `order_id`.
- Los números comerciales legibles (como `order_number`) son campos adicionales con su propia secuencia o lógica, no el PK.

---

## Nombres

- Tablas y columnas: `snake_case` en inglés.
- Nombres de tablas en **singular**: `product`, no `products`. Excepción: tablas de asociación N:N como `user_roles`, `role_permissions`.
- Nombres descriptivos y sin abreviaciones: `inventory_movements`, no `inv_mvmts`.
- Prefijos de tabla para grupos relacionados: `inventory_balances`, `inventory_movements`, `inventory_reservations`.

---

## Fechas y timestamps

- `timestamptz` para timestamps que representan eventos (con zona horaria).
- `date` solo cuando la hora no es relevante (ej. fecha de vencimiento).
- `created_at timestamptz NOT NULL DEFAULT now()` en toda tabla.
- `updated_at timestamptz NOT NULL DEFAULT now()` en tablas mutables, mantenido via trigger `set_updated_at()`.
- `archived_at timestamptz` para archivado lógico (solo donde aplica — no en todas las tablas).
- No usar `deleted_at` de forma indiscriminada; los registros históricos no se eliminan.

---

## Tipos monetarios

**Regla: nunca usar `float`, `real` o `double precision` para montos monetarios.**

Los tipos de punto flotante tienen errores de redondeo que son inaceptables en contextos financieros.

| Uso | Tipo PostgreSQL | Ejemplo |
|---|---|---|
| Montos (precios, costos, totales) | `numeric(15, 2)` | `1234.99` |
| Tasas de cambio | `numeric(18, 6)` | `36.500000` |
| Porcentajes | `numeric(5, 4)` | `0.1500` (15%) |

`numeric(15, 2)` permite hasta 13 dígitos enteros y 2 decimales: suficiente para cualquier transacción de Lanz Technology en USD o VES.

---

## Monedas

- El código de moneda se almacena como `char(3)` usando el estándar ISO 4217.
- Monedas inicialmente soportadas: `USD`, `VES`.
- El constraint `CHECK (currency_code IN ('USD', 'VES'))` se aplica en las columnas relevantes.
- El monto se almacena en la moneda indicada; no hay conversión automática.
- Cuando se requiere conservar el valor histórico en múltiples monedas, se almacenan ambos montos con la tasa de cambio en el momento de la operación.

---

## Cantidades de inventario

- Las cantidades de productos (unidades) usan `integer`, no `numeric`.
- Lanz Technology vende productos DJI por unidad; no hay fracciones.
- `CHECK (quantity > 0)` en líneas de pedido (no puede ser cero).
- `CHECK (on_hand >= 0)` en balances de inventario (no stock negativo).

---

## Constraints de base de datos

Siempre definir constraints para proteger invariantes que la aplicación podría violar:

```sql
-- Montos no negativos
CONSTRAINT products_price_check CHECK (sale_price >= 0)

-- Estados válidos (enum controlado)
CONSTRAINT orders_status_check CHECK (status IN ('draft', 'confirmed', ...))

-- Coherencia de fechas
CONSTRAINT orders_cancel_consistency CHECK (
  (status = 'cancelled') = (cancelled_at IS NOT NULL)
)

-- Unicidad parcial (solo una imagen principal por producto)
CREATE UNIQUE INDEX product_images_primary_uidx
  ON product_images(product_id) WHERE is_primary = true;
```

---

## Enums vs tablas de catálogo

**Estados y tipos** con valores predefinidos y estables → `text` con `CHECK` constraint.

Ventajas sobre `ENUM` de PostgreSQL:
- Agregar valores sin `ALTER TYPE` (solo actualizar el `CHECK`).
- Más fácil de migrar.
- Portable entre dumps de base de datos.

**Catálogos dinámicos** que el usuario puede ampliar → tabla separada (ej. `inventory_locations`).

---

## JSONB

Usar `jsonb` solo en casos justificados:

- `audit_logs.previous_data` y `new_data`: el esquema de datos auditados varía por entidad.
- `audit_logs.metadata` y `orders` metadata: datos de contexto no estructurados.

No usar `jsonb` para sustituir columnas relacionales bien definidas.

---

## Archivado lógico

Entidades que necesitan archivado lógico (soft delete):

| Tabla | Campo | Condición |
|---|---|---|
| `products` | `archived_at` | Producto descontinuado |
| `customers` | `archived_at` | Cliente inactivo |
| `inventory_locations` | `is_active` | Ubicación deshabilitada |
| `categories` | `is_active` | Categoría deshabilitada |

No usar archivado lógico en tablas de registros históricos (`inventory_movements`, `order_items`, `audit_logs`). Estos registros son inmutables, no se archivan.

---

## Triggers

- Un solo trigger reutilizable: `set_updated_at()`.
- Definido en migration 001 (primero), aplicado en cada tabla que lo necesite.
- Nombre del trigger: `<tabla>_updated_at`.
- No crear triggers que oculten lógica de negocio compleja; usar Server Actions explícitas.

---

## Funciones PostgreSQL

Reglas para funciones de base de datos:

| Regla | Motivo |
|---|---|
| `SECURITY DEFINER` + `SET search_path = public` | Prevenir search_path injection |
| `REVOKE EXECUTE FROM PUBLIC` + grants explícitos | Mínimo privilegio |
| `LANGUAGE plpgsql` para lógica compleja | Soporte de excepciones y variables |
| `LANGUAGE sql` para consultas simples (`has_permission`) | Mejor optimización |
| Documentar con `COMMENT ON FUNCTION` | Mantenibilidad |
| No crear funciones que dupliquen lógica de la aplicación | Separación de responsabilidades |

---

## Seguridad en funciones SECURITY DEFINER

Checklist obligatorio:

- [ ] `SET search_path = public` siempre incluido
- [ ] `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC`
- [ ] `GRANT EXECUTE` solo a roles necesarios (`authenticated`, `service_role`)
- [ ] Verificación de permisos del llamante dentro de la función cuando aplica
- [ ] Documentación del por qué se usa `SECURITY DEFINER`

---

## Migraciones

- Un archivo por grupo lógico de cambios (no todo en un solo archivo).
- Nombre: `YYYYMMDDHHMMSS_descripcion_en_snake_case.sql`.
- Orden garantizado por el timestamp del nombre.
- Cada migración es idempotente donde sea posible (`ON CONFLICT DO NOTHING`, `CREATE ... IF NOT EXISTS`).
- Las migraciones de seed usan `ON CONFLICT DO NOTHING` para ser re-ejecutables.
- No ejecutar migraciones directamente en producción sin revisión. Ver `docs/architecture/database-operations.md`.

---

## Índices

Crear índices para:
- Columnas usadas en `WHERE` frecuente (status, category_id, etc.)
- Columnas de foreign key sin índice automático
- Consultas de ordenación por fecha (`created_at DESC`)
- Referencias de auditoría (`reference_type`, `reference_id`)

Usar índices parciales cuando solo un subconjunto de filas se consulta:
```sql
-- Solo productos activos (archived_at IS NULL)
CREATE INDEX idx_products_active ON products(archived_at) WHERE archived_at IS NULL;

-- Solo reservas activas
CREATE INDEX idx_reservations_active ON inventory_reservations(product_id, location_id)
  WHERE status = 'active';
```

No crear índices especulativos sin una consulta real que los justifique.

---

## ON DELETE behavior

| Situación | Comportamiento |
|---|---|
| Usuario eliminado de `auth.users` | CASCADE a `profiles` (el usuario ya no existe) |
| Perfil eliminado | CASCADE a `user_roles`; SET NULL en referencias históricas |
| Producto eliminado | RESTRICT — un producto con movimientos no puede eliminarse |
| Pedido eliminado | RESTRICT — un pedido con ítems no puede eliminarse |
| Categoría eliminada | SET NULL en `products.category_id` (el producto sobrevive) |
| Role eliminado | RESTRICT si tiene user_roles activos |
| Permission eliminado | CASCADE en role_permissions |

**Regla general**: usar `RESTRICT` para relaciones que protegen integridad histórica; `SET NULL` para referencias opcionales; `CASCADE` solo para datos que son propiedad del padre y no tienen significado independiente.
