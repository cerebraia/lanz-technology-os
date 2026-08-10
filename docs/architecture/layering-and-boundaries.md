# Capas y límites del sistema

Define la separación de responsabilidades entre capas y las reglas para mantener la arquitectura limpia a medida que el sistema crece.

---

## Las cinco capas

### 1. Presentación

**Qué incluye:**
- Componentes React en `app/` y `components/`
- Layouts, páginas y fragmentos visuales
- Formularios y controles de UI

**Responsabilidades:**
- Renderizar datos recibidos como props
- Capturar entrada del usuario
- Delegar acciones a la capa de casos de uso
- Manejar estados de carga, vacío y error de forma visual

**Prohibiciones:**
- No acceder directamente a la base de datos
- No contener lógica de negocio
- No calcular rentabilidad, stock ni totales
- No hacer llamadas HTTP externas directamente

---

### 2. Casos de uso (Application layer)

**Ubicación prevista:** `features/<dominio>/actions/` o `features/<dominio>/services/`

**Qué incluye:**
- Server Actions de Next.js
- Funciones de servicio de aplicación
- Orquestación de flujos multi-dominio

**Responsabilidades:**
- Coordinar las reglas de negocio con el acceso a datos
- Validar entradas antes de persistir
- Llamar al dominio correcto para cada operación
- Garantizar la atomicidad de operaciones que afectan múltiples tablas

**Prohibiciones:**
- No duplicar lógica de dominio
- No acceder a la base de datos directamente (delegar a la capa de datos)
- No generar HTML ni respuestas de UI

---

### 3. Reglas de negocio (Domain layer)

**Ubicación prevista:** `features/<dominio>/domain/`

**Qué incluye:**
- Funciones puras que implementan las reglas de negocio
- Tipos de dominio (no de base de datos)
- Validaciones de invariantes

**Ejemplos:**
- "El saldo de inventario no puede ser negativo"
- "Un pedido cancelado no puede volver a estado activo"
- "El costo histórico de un pedido es inmutable"

**Responsabilidades:**
- Contener las reglas que son verdad independientemente de cómo se almacenen los datos
- Ser testeable sin base de datos ni framework

**Prohibiciones:**
- No hacer I/O (base de datos, red, filesystem)
- No conocer detalles de Next.js ni de Supabase
- No importar desde otras capas

---

### 4. Acceso a datos (Data layer)

**Ubicación prevista:** `features/<dominio>/data/` o `lib/db/`

**Qué incluye:**
- Queries y mutations a Supabase / PostgreSQL
- Funciones de repositorio por entidad

**Responsabilidades:**
- Encapsular todos los accesos a la base de datos
- Mapear datos de base de datos a tipos de dominio
- Aplicar filtros de seguridad (RLS como segunda defensa)

**Prohibiciones:**
- No contener lógica de negocio
- No ser llamado directamente desde componentes de UI
- No generar HTML

---

### 5. Integraciones externas

**Ubicación prevista:** `lib/integrations/` o `features/<dominio>/integrations/`

**Qué incluye:**
- Clientes de APIs externas (Supabase Storage, WhatsApp, pasarelas de pago futuras)
- Adaptadores que traducen respuestas externas a tipos internos

**Responsabilidades:**
- Aislar el sistema de cambios en APIs externas
- Encapsular autenticación y configuración de terceros

**Prohibiciones:**
- No mezclar lógica de negocio con código de integración
- No exponer tipos externos directamente al dominio

---

## Tipos y contratos

**Ubicación:** `types/`

**Qué incluye:**
- Tipos compartidos entre múltiples dominios
- Interfaces de respuesta de API
- Enumeraciones globales

**Regla:**
- Cada dominio define sus propios tipos internos en `features/<dominio>/types.ts`
- Solo los tipos que cruzan dominios van a `types/`

---

## Problemas a evitar

### Componentes con demasiada lógica

**Síntoma:** Un componente calcula totales, llama a la base de datos y renderiza al mismo tiempo.

**Solución:** Separar en Server Component (obtiene datos) + componente de presentación (renderiza).

---

### Acceso directo a base de datos desde UI

**Síntoma:** Un `page.tsx` importa una función que construye una query de Supabase.

**Solución:** La página llama a una función de servicio (`features/<dominio>/actions/`), que llama al repositorio (`features/<dominio>/data/`).

---

### Dependencias circulares entre dominios

**Síntoma:** `sales` importa desde `inventory` e `inventory` importa desde `sales`.

**Solución:** Definir la dirección de dependencia correcta. Si ambos se necesitan, probablemente falta un evento o una función de orquestación en la capa de casos de uso.

---

### Utilidades genéricas sin propósito

**Síntoma:** Una carpeta `utils/` con decenas de funciones sin relación entre sí.

**Solución:** Las utilidades van en `lib/` agrupadas por propósito (`lib/format/`, `lib/validation/`, etc.). Si una utilidad solo sirve a un dominio, vive en ese dominio.

---

### Servicios globales difíciles de mantener

**Síntoma:** Un `GlobalService` que conoce y orquesta todos los dominios.

**Solución:** Cada dominio tiene sus propios servicios. La orquestación entre dominios ocurre en Server Actions o funciones de composición explícitas.

---

### Acoplamiento entre dominios

**Síntoma:** `inventory` importa funciones internas de `sales` para saber si un pedido está activo.

**Solución:** `inventory` solo conoce movimientos. `sales` llama a `inventory` cuando necesita reservar o liberar stock, no al revés.

---

## Infraestructura que no se necesita todavía

No se anticipa ninguna de las siguientes infraestructuras hasta que exista una necesidad técnica demostrable:

- Message queues / brokers de eventos
- Microservicios separados
- GraphQL
- Redis o cachés distribuidos
- Workers de background externos

El sistema comenzará con Server Actions de Next.js y consultas directas a Supabase.
