# Convenciones de código

Define los estándares de desarrollo para Lanz Technology OS.

---

## Nomenclatura

### Archivos y carpetas

- Siempre en `kebab-case`: `product-card.tsx`, `use-inventory.ts`, `order-service.ts`
- Sin espacios, sin mayúsculas, sin guión bajo
- Nombres descriptivos y específicos

### Componentes React

- Siempre en `PascalCase`: `ProductCard`, `OrderStatusBadge`, `InventoryTable`
- El nombre del componente debe coincidir con el nombre del archivo

### Funciones y variables

- Siempre en `camelCase`: `getProducts`, `currentUser`, `calculateTotal`
- Los booleanos deben leer como pregunta: `isLoading`, `hasPermission`, `canEdit`
- Evitar abreviaciones no evidentes: `userIdentifier` no `usrId`

### Tipos e interfaces TypeScript

- Siempre en `PascalCase`: `Product`, `OrderStatus`, `InventoryMovement`
- Preferir tipos (`type`) sobre interfaces (`interface`) salvo que se necesite extensión
- No prefixar con `I` (no `IProduct`, sino `Product`)

### Constantes globales

- En `UPPER_SNAKE_CASE` cuando son constantes verdaderas y globales: `MAX_FILE_SIZE`, `DEFAULT_CURRENCY`
- Las constantes de configuración por módulo no necesitan este patrón si viven en `config/`

### Idioma

- Nombres técnicos internos (archivos, variables, funciones, tipos, rutas de API, claves de base de datos): **inglés**
- Textos visibles para usuarios finales (etiquetas, mensajes, títulos, placeholders): **español**

---

## TypeScript

### Strictness

- `strict: true` siempre activado en `tsconfig.json`
- No usar `any` salvo que exista una justificación técnica documentada en el mismo archivo
- No usar `as` (type assertion) sin justificación; preferir type guards

### Tipos explícitos vs inferencia

- Declarar tipos explícitamente en:
  - Parámetros de funciones y Server Actions
  - Valores de retorno de funciones de servicio
  - Props de componentes
- Permitir inferencia en:
  - Variables locales evidentes: `const count = 0`
  - Arrays y objetos inicializados con tipo claro

### Reglas para evitar `any`

Si necesitas representar un tipo desconocido:
- Usar `unknown` y narrow correctamente
- Usar generics cuando aplique
- Si el tipo viene de una API externa sin types, crear un tipo de adaptador

### Nullability

- Preferir `undefined` sobre `null` en tipos propios
- `null` puede usarse cuando viene de la base de datos o APIs externas

---

## Importaciones

```typescript
// 1. Módulos externos (React, Next.js, librerías)
import { Suspense } from 'react'
import type { Metadata } from 'next'

// 2. Tipos compartidos
import type { Product } from '@/types'

// 3. Utilidades y lib
import { formatCurrency } from '@/lib/format/currency'

// 4. Código del mismo dominio o módulo
import { getProducts } from './data'
import { ProductCard } from './components/product-card'
```

- Usar siempre el alias `@/` para importaciones absolutas
- No usar rutas relativas que suban más de un nivel (`../../`)
- Importar con `import type` cuando solo se usan tipos

---

## Componentes

### Server Components (por defecto)

```typescript
// Sin directiva — Server Component por defecto
export default async function ProductList() {
  const products = await getProducts()
  return <ul>{products.map(p => <ProductItem key={p.id} product={p} />)}</ul>
}
```

### Client Components (solo cuando sea necesario)

```typescript
'use client'

import { useState } from 'react'

export function QuantityInput({ initial }: { initial: number }) {
  const [qty, setQty] = useState(initial)
  return <input value={qty} onChange={e => setQty(Number(e.target.value))} />
}
```

Usar `'use client'` únicamente cuando el componente necesite:
- Estado (`useState`, `useReducer`)
- Efectos (`useEffect`)
- Manejadores de eventos (`onClick`, `onChange`)
- APIs del navegador (`localStorage`, `window`, etc.)

### Props

- Definir props con un tipo explícito, no inline para componentes no triviales:

```typescript
type ProductCardProps = {
  product: Product
  showPrice?: boolean
}

export function ProductCard({ product, showPrice = true }: ProductCardProps) {
  // ...
}
```

- Mantener componentes pequeños: si un componente supera ~80 líneas, evaluar si puede dividirse.

---

## Hooks

- Nombrar con prefijo `use`: `useProducts`, `useInventoryMovements`
- Ubicar en `features/<dominio>/hooks/` si son específicos del dominio
- Ubicar en `lib/hooks/` si son reutilizables entre dominios
- No duplicar lógica entre hooks similares

---

## Server Actions

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { validateOrderInput } from './domain/validate-order'
import { createOrder } from './data/orders'

export async function createOrderAction(formData: FormData) {
  const input = {
    productId: formData.get('productId') as string,
    quantity: Number(formData.get('quantity')),
  }

  const validated = validateOrderInput(input)
  if (!validated.success) return { error: validated.error }

  await createOrder(validated.data)
  revalidatePath('/admin/pedidos')
}
```

- Siempre validar la entrada antes de persistir
- Verificar permisos del usuario antes de ejecutar
- Usar `revalidatePath` o `revalidateTag` para invalidar caché cuando corresponda

---

## Manejo de errores

- No silenciar errores con `catch` vacíos
- Los errores de dominio deben ser tipos explícitos, no strings genéricos
- En Server Actions, retornar `{ error: string }` o `{ data: T }` de forma consistente
- Nunca exponer stack traces ni detalles internos al cliente

---

## Comentarios

- No documentar qué hace el código; el código bien nombrado ya lo dice.
- Escribir un comentario solo cuando el **por qué** no es obvio:
  - Workarounds por limitaciones conocidas
  - Invariantes de negocio no evidentes
  - Comportamiento contraintuitivo documentado

```typescript
// El precio se multiplica por 100 porque Supabase lo almacena en centavos
const priceInCents = product.price * 100
```

- No dejar código comentado en el repositorio.
- No dejar `// TODO` sin fecha ni responsable.

---

## Validación

- Toda entrada del usuario se valida en el servidor, independientemente de la validación en el cliente.
- El cliente puede validar para mejorar la UX, nunca como sustituto de la validación del servidor.
- Al incorporar validación con esquemas (Zod u otro), ubicarlos en `features/<dominio>/domain/` o `lib/validation/`.

---

## Dependencias

- Evaluar antes de instalar cualquier librería: ¿está mantenida? ¿qué tamaño agrega al bundle? ¿es realmente necesaria?
- No instalar dependencias para fases futuras.
- Las dependencias de UI, gestión de estado y testing se incorporarán en sus fases correspondientes.
- Documentar la justificación de una dependencia nueva de peso en el ADR correspondiente.

---

## Formato

- El proyecto usa ESLint con `eslint-config-next`. No se agrega Prettier ni otras herramientas de formato mientras el equipo sea pequeño y la configuración actual sea suficiente.
- Si se incorpora Prettier en el futuro, se documentará en un ADR.
- La indentación es de 2 espacios (default de Next.js y TypeScript).
