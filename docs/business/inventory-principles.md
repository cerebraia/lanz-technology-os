# Principios de inventario

Define las reglas fundamentales del inventario. Son invariantes del dominio y no deben violarse al implementar el módulo.

**Estado: No implementado.** Este documento es la referencia de diseño para la Fase 7.

---

## El inventario como eje operativo

El inventario es uno de los activos más críticos de Lanz Technology. Su gestión correcta es esencial para:

- Conocer la disponibilidad real de productos.
- Comprometer capital en compras e importaciones de forma informada.
- Calcular rentabilidad por producto.
- Garantizar que los pedidos se cumplan.
- Mantener trazabilidad total para auditoría.

---

## Principio fundamental: el stock nunca se modifica directamente

El saldo de inventario es siempre el resultado de sumar todos los movimientos registrados.

```
saldo_actual = suma de todos los movimientos del producto
```

No existe una operación "editar stock". Cualquier cambio en el inventario genera un movimiento.

---

## Tipos de movimientos

| Tipo | Efecto | Origen |
|---|---|---|
| `entry` | Aumenta saldo | Compra recibida, importación recibida, devolución de cliente |
| `exit` | Reduce saldo | Venta despachada, pérdida, producto dañado |
| `reservation` | Reserva saldo (no reduce) | Pedido confirmado |
| `reservation_release` | Libera reserva | Pedido cancelado |
| `adjustment` | Corrige diferencia | Conteo físico con diferencia respecto al sistema |
| `compensatory` | Corrige un movimiento erróneo | Error en un movimiento previo |

---

## Estructura mínima de un movimiento

Cada movimiento debe registrar:

- **product_id** — producto afectado
- **type** — tipo de movimiento (entry, exit, reservation, adjustment, compensatory)
- **quantity** — cantidad (positiva para entradas, negativa para salidas)
- **user_id** — usuario que generó el movimiento
- **created_at** — timestamp de creación
- **reason** — motivo del movimiento
- **reference** — referencia al objeto origen (pedido, importación, orden de compra, etc.)
- **notes** — notas adicionales opcionales

---

## Reglas invariantes

### Los movimientos no se eliminan

Un movimiento registrado es permanente. Si se cometió un error:

1. Se crea un movimiento compensatorio que revierte el efecto del erróneo.
2. Se documenta la razón del error.
3. El movimiento original queda visible en el historial.

No existe un botón "eliminar movimiento".

### Los saldos no pueden ser negativos

El sistema debe validar antes de permitir un movimiento de salida que el saldo resultante no sea negativo.

Excepción: si en el futuro el negocio requiere saldos negativos (ej. pre-venta sin stock), se documentará explícitamente como regla de negocio aprobada.

### El inventario en tránsito es distinto del inventario disponible

Un producto en una importación en curso existe en el sistema pero **no está disponible** para venta.

El saldo disponible no incluye el inventario en tránsito.

```
saldo_disponible = entradas - salidas - reservas
saldo_en_tránsito = suma de líneas de importaciones activas
saldo_total = saldo_disponible + saldo_en_tránsito
```

### El costo histórico se conserva

Cuando se recibe mercancía, se registra el costo unitario en el momento de la recepción. Este costo es inmutable y se usa para calcular márgenes históricos.

---

## Reservas de inventario

Cuando un pedido se confirma:

1. Se crea un movimiento de tipo `reservation` por cada producto.
2. El saldo disponible se reduce pero el saldo físico no cambia.
3. Si el pedido se cancela, se crea un movimiento `reservation_release` que restaura la disponibilidad.
4. Al despachar el pedido, la reserva se convierte en una salida real (`exit`).

---

## Ajustes de inventario

Un ajuste ocurre cuando el conteo físico no coincide con el saldo del sistema.

- Solo usuarios con permiso `inventory:adjust` pueden crear ajustes.
- El ajuste requiere: cantidad real contada, motivo y aprobación administrativa.
- El ajuste genera un movimiento de tipo `adjustment` que documenta la diferencia.
- Los ajustes quedan registrados en auditoría.

---

## Alertas de stock

El sistema debe emitir alertas cuando el saldo disponible de un producto cae por debajo de un umbral mínimo configurable por producto.

---

## Integraciones con otros dominios

| Dominio | Interacción |
|---|---|
| `sales` | Genera reservas al confirmar pedidos; salidas al despachar |
| `purchasing` | Genera entradas al recibir órdenes de compra locales |
| `imports` | Genera entradas al recibir importaciones; registra inventario en tránsito |
| `audit` | Observa todos los movimientos de inventario |
| `finance` | Consulta costos históricos para calcular rentabilidad |

---

## Lo que el módulo de inventario NO hace

- No gestiona dónde físicamente está la mercancía (no es un WMS).
- No maneja ubicaciones o zonas de almacén (en esta etapa).
- No calcula precios de venta (eso pertenece a `catalog`).
- No gestiona devoluciones directamente (las devoluciones generan movimientos, pero la lógica de aprobación está en `sales`).
