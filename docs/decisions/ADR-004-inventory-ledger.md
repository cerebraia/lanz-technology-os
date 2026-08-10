# ADR-004 — Ledger de inventario con saldos materializados

**Fecha:** 2026-07-29
**Estado:** Aceptado
**Autores:** Lanz Technology

---

## Contexto

El inventario es uno de los ejes operativos críticos de Lanz Technology. Se necesita una arquitectura que garantice:

1. Trazabilidad completa de cada cambio de stock.
2. Auditoría de quién cambió qué y cuándo.
3. Corrección de errores sin pérdida de historial.
4. Consistencia bajo operaciones concurrentes.
5. Rendimiento en consultas de disponibilidad frecuentes.

Se evaluaron dos enfoques:

**Opción A**: Saldo calculado → solo tabla de movimientos; el saldo se calcula en tiempo real como `SUM(quantity)`.

**Opción B**: Saldo materializado → tabla de movimientos + tabla de saldos actualizados atómicamente.

---

## Decisión

Implementar un **ledger de inventario con saldo materializado** (Opción B).

- `inventory_movements`: ledger inmutable de todos los cambios.
- `inventory_balances`: saldo materializado por producto+ubicación.
- `record_inventory_movement()`: función PostgreSQL que actualiza ambas tablas atómicamente.

---

## Razones para el saldo materializado

### Rendimiento

Con el saldo calculado dinámicamente, consultar la disponibilidad de un producto requiere `SUM(quantity)` sobre todos sus movimientos históricos. A medida que el historial crece (miles de movimientos), esta consulta se degrada.

Con el saldo materializado, la consulta es O(1): `SELECT on_hand FROM inventory_balances WHERE product_id = $1`.

### Consistencia garantizada

La función `record_inventory_movement()` usa `SELECT ... FOR UPDATE` para bloquear la fila de saldo antes de modificarla. Esto garantiza que dos operaciones concurrentes (ej. dos ventas simultáneas del mismo producto) no produzcan saldos incorrectos.

### Validación en la base

La función valida que `on_hand + quantity >= 0` antes de persistir. Si no hay stock suficiente, la operación falla atómicamente y el saldo queda intacto.

---

## Razones para no usar solo el ledger calculado

Con el saldo calculado puro:
- Consultar disponibilidad es O(n) donde n es el número de movimientos históricos.
- Verificar que una venta no deja el saldo negativo requiere calcular `SUM(quantity)` antes de insertarle el movimiento, bajo riesgo de race condition.
- Los bloqueos necesarios para la consistencia serían más complejos de implementar correctamente.

---

## Estructura física

```sql
-- Ledger inmutable
inventory_movements (
  id, product_id, location_id, movement_type,
  quantity, quantity_before, quantity_after,
  reason, reference_type, reference_id,
  notes, created_by, created_at
)

-- Saldo materializado
inventory_balances (
  id, product_id, location_id,
  on_hand, reserved, updated_at
)
```

### Definiciones inequívocas

```
on_hand   = existencia física registrada (resultado de movimientos)
reserved  = comprometido a pedidos activos (reservas activas)
available = on_hand - reserved  (siempre derivado, nunca almacenado)
```

---

## Función record_inventory_movement()

Garantías de la función:

1. Crea el saldo si no existe (primer movimiento del producto en esa ubicación).
2. Bloquea la fila con `FOR UPDATE` antes de leer.
3. Valida: `on_hand + quantity >= 0`.
4. Inserta el movimiento con `quantity_before` y `quantity_after` explícitos.
5. Actualiza el saldo en la misma transacción.
6. Revierte todo si cualquier paso falla.

No existe ninguna otra forma de modificar `on_hand` en producción.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Desincronía entre movements y balances | Función atómica + RLS sin writes directos en balances |
| Movimientos con datos incorrectos | Corrección via movimientos compensatorios (historial preservado) |
| Rendimiento con tablas de movimientos grandes | Índices por `(product_id, location_id, created_at DESC)` |
| Verificación de consistencia | Script de auditoría que compara `SUM(movements) = balance` |

---

## Consecuencias

- No existe ninguna operación `UPDATE inventory_balances SET on_hand = X` en el código de aplicación.
- Todos los cambios de inventario pasan por Server Actions que llaman a la función de base de datos.
- El historial completo de movimientos está disponible para auditoría.
- La corrección de errores siempre genera movimientos compensatorios visibles.
- Los saldos negativos son imposibles en producción por diseño de la función.
