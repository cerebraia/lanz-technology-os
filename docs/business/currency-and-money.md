# Monedas y montos monetarios

Define la estrategia para el manejo de dinero en Lanz Technology OS.

---

## Contexto

Lanz Technology opera en Venezuela. Los productos DJI se compran en USD al proveedor y se venden en USD o VES a clientes. La tasa de cambio es variable y no está bajo control de la empresa.

---

## Principios fundamentales

1. **Nunca usar `float` o `double` para montos.** Los tipos de punto flotante producen errores de redondeo (ej. `0.1 + 0.2 ≠ 0.3` en binario). Para operaciones financieras esto es inaceptable.

2. **Usar `numeric(15, 2)` para montos.** Precisión decimal exacta, sin errores de redondeo.

3. **Almacenar el monto en la moneda original de la transacción.** No convertir automáticamente.

4. **Preservar datos históricos.** El monto y la moneda de una transacción pasada no cambian retroactivamente.

---

## Tipos de datos

| Dato | Tipo PostgreSQL | Justificación |
|---|---|---|
| Precios de venta | `numeric(15, 2)` | 13 dígitos enteros + 2 decimales |
| Costos | `numeric(15, 2)` | Mismo que precios |
| Totales de pedido | `numeric(15, 2)` | Calculado, mismo tipo |
| Descuentos | `numeric(15, 2)` | Monto fijo, no porcentaje |
| Tasas de cambio | `numeric(18, 6)` | Mayor precisión para tasas |
| Porcentajes | `numeric(5, 4)` | 0.1500 = 15% |

---

## Monedas soportadas (MVP)

| Código ISO | Nombre | Uso |
|---|---|---|
| `USD` | Dólar estadounidense | Precio principal, costos, compras al proveedor |
| `VES` | Bolívar venezolano | Ventas locales cuando el cliente paga en bolívares |

Monedas adicionales se incorporarán si el negocio lo requiere, con migración de la constraint correspondiente.

---

## Estrategia para el MVP

### Regla 1: Un monto, una moneda

Cada precio, costo o total se almacena una sola vez en la moneda de la transacción.

```sql
sale_price    numeric(15,2) NOT NULL DEFAULT 0
currency_code char(3)       NOT NULL DEFAULT 'USD'
```

### Regla 2: Sin conversión automática

El sistema no consulta tasas de cambio externas ni convierte automáticamente. Si el usuario registra una venta en VES, ingresa el monto en VES.

### Regla 3: La tasa de cambio solo se registra cuando es necesario para conservar valor histórico

Ejemplo: si una importación se paga en USD pero los gastos adicionales se pagan en VES, se registra la tasa del día junto con ambos montos para poder calcular el costo total en una sola moneda.

Este campo `exchange_rate numeric(18, 6)` se agregará en las tablas de finance e imports cuando se implementen esos módulos.

### Regla 4: Los reportes muestran la moneda original

No se normalizan automáticamente todos los montos a una sola moneda para comparación. Cuando se requiere comparar, el usuario o el reporte indica la moneda base y la tasa a usar.

---

## Campos de costo — acceso restringido

Los costos de productos y compras son información confidencial de Lanz Technology.

Campos restringidos:

| Tabla | Campo | Permiso requerido |
|---|---|---|
| `products` | `reference_cost` | `finance.read_costs` |
| `order_items` | `unit_cost` | `orders.view_cost` |

La protección se implementa en la capa de aplicación (Server Actions) que omiten estos campos en respuestas a usuarios sin el permiso correspondiente.

---

## Cálculo de totales en pedidos

Los totales de pedido se calculan en la aplicación antes de persistir, no en la base de datos.

```
subtotal       = SUM(line_total)
line_total     = (unit_price × quantity) - discount_amount
total_amount   = subtotal - discount_amount (descuento global)
```

La base de datos almacena el resultado calculado para consulta directa eficiente. No hay triggers de recálculo — la responsabilidad es del Server Action que crea/actualiza el pedido.

---

## Evolución futura

Cuando el módulo de Finanzas se implemente (Fase 8), se evaluará:

- Agregar `exchange_rate` en registros donde se cruzan monedas.
- Flujo de caja multimoneda con conversión manual a moneda base.
- Rentabilidad calculada en USD como moneda base de referencia.

No se implementará conversión automática via API de tasas de cambio en las primeras fases.
