# Lanz Technology OS — Estabilización prioritaria

**Fecha:** 2026-08-05

---

## Estado de los siete problemas

| # | Problema | Estado |
|---|----------|--------|
| 1 | Edición de productos | ✓ Resuelto (sesión anterior) |
| 2 | Imágenes de productos | ✓ Funcional (sesión anterior) |
| 3 | Inventario y stock | ✓ Existente — documentado |
| 4 | Creación de pedidos manuales | ✓ Funcional tras migración 20260804000003 |
| 5 | Navegación activa del inventario | ✓ Corregido |
| 6 | Botón flotante de WhatsApp | ✓ Implementado |
| 7 | Canal de YouTube + video DJI Mic Mini | ✓ Implementado |

---

## 1. Edición de productos

**Causa raíz (sesión anterior):**
- `getCategories()` lanzaba excepción ante cualquier error de Supabase.
- La página usaba un IIFE triple-try-catch que atrapaba y re-envolvía el error original, interrumpiendo el manejo nativo de Next.js.

**Corrección aplicada:**
- `getCategories` devuelve `[]` en error (log en servidor), no lanza.
- `page.tsx` reescrito sin IIFE — queries directas y secuenciales.
- `error.tsx` simplificado con detección de tipo de error.
- `loading.tsx` creado (skeleton de carga).

**Ruta oficial:** `/admin/catalog/products/[id]` — única convención.

---

## 2. Imágenes de productos

**Estado:** Funcional desde implementación inicial.

**Flujo verificado:**
- Crear producto → ID disponible → sección Multimedia visible
- Subir JPEG/PNG/WebP hasta 5 MB
- Establecer imagen principal, reordenar, eliminar
- Bucket: `catalog-images` (único, público)
- Validación: tipo MIME + tamaño en cliente y servidor

---

## 3. Inventario y stock

**Estado:** Funcional mediante rutas existentes.

**Flujo para modificar stock:**
1. `/admin/inventory/entries/new` — Registrar entrada (mercancía recibida)
2. `/admin/inventory/adjustments/new` — Ajuste (diferencias físico vs sistema)
3. `/admin/inventory` — Ver saldos actuales (on_hand, reserved, available)
4. `/admin/inventory/movements` — Historial de movimientos (solo lectura)

**Principio:** Stock nunca se modifica directamente. Todo cambio pasa por `record_inventory_movement()` o `reserve_inventory_movement()` (funciones SECURITY DEFINER).

---

## 4. Creación de pedidos manuales

**Causa raíz:** Migración `20260804000003_manual_sales.sql` tenía firma SQL inválida (parámetros requeridos después de opcionales). Migración no estaba desplegada.

**Corrección:** Parámetros reordenados + migración desplegada.

**Flujo:**
- `/admin/sales/manual` → formulario completo
- Función `create_manual_sale()` atómica en PL/pgSQL
- Crea: cliente (si nuevo) → pedido → ítems → descuento de inventario → pago → historial
- Rollback total si falla cualquier paso

---

## 5. Navegación activa del inventario

**Causa raíz:** `isActive()` usaba `pathname.startsWith(href + '/')` para todos los hijos. `/admin/inventory` coincidía con `/admin/inventory/movements`, `/admin/inventory/entries`, etc.

**Corrección:** Nueva función `isChildActive()` con reglas específicas:
- `/admin/inventory` → activo solo en exacto o `[id]` UUID de un ítem
- `/admin/orders`, `/admin/sales`, `/admin/crm/customers` → misma lógica
- Demás rutas hijas → `pathname.startsWith(href + '/')`

**Archivos modificados:** `components/layout/sidebar.tsx`

---

## 6. Botón flotante de WhatsApp

**Componente:** `components/store/whatsapp-floating-button.tsx`

**Configuración:** `NEXT_PUBLIC_WHATSAPP_NUMBER` (env var)

**Páginas donde aparece:**
- Todo el store layout: `/catalog`, `/category/*`, `/product/*`, `/cart`, `/about`, `/shipping`, `/warranty`, `/faq`, `/contact`
- Home (`app/page.tsx`) — incluido directamente por estar fuera del store layout

**No aparece en:** `/admin`, `/login`

**Diseño:** botón circular, verde #25D366, sombra verde, hover escala 1.1, `z-50`, posición `fixed bottom-6 right-6`, safe-area compatible.

---

## 7. YouTube

**Canal oficial:** https://www.youtube.com/@lanz_technology
**Video DJI Mic Mini:** https://www.youtube.com/watch?v=MDRHuMUHH9Q&t=31s

### Modelo de datos

Migración `20260805000001_product_youtube_url.sql`:
- Columna `youtube_url text` nullable en `products`
- Validación en capa de aplicación: URL debe contener `youtube.com/` o `youtu.be/`

### Componentes

- `components/store/youtube-embed.tsx` — `YouTubeEmbed` con:
  - Extracción del video ID desde URL
  - Embed vía `youtube-nocookie.com` (sin cookies de rastreo)
  - Proporción 16:9 responsive
  - `loading="lazy"`, sin autoplay

### Integración

**Home (`app/page.tsx`):** Sección "Contenido de Lanz Technology" con video DJI Mic Mini hardcodeado + botón "Ver canal en YouTube".

**Producto (`app/(store)/product/[slug]/page.tsx`):** Sección "Conoce más sobre este producto" visible solo si `product.youtube_url` está configurado.

**Admin:** Campo "URL del video" en el formulario de producto (`features/catalog/components/product-form.tsx`).

---

## Migraciones creadas

| Migración | Descripción | Estado |
|-----------|-------------|--------|
| `20260805000001_product_youtube_url.sql` | Agrega `youtube_url` a `products` | Desplegada |

---

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `components/store/whatsapp-floating-button.tsx` | Botón flotante de WhatsApp |
| `components/store/youtube-embed.tsx` | Reproductor YouTube seguro |
| `supabase/migrations/20260805000001_product_youtube_url.sql` | Columna youtube_url |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/layout/sidebar.tsx` | `isChildActive()` para navegación precisa |
| `app/(store)/layout.tsx` | WhatsApp flotante en store layout |
| `app/page.tsx` | Sección YouTube + WhatsApp flotante |
| `app/(store)/product/[slug]/page.tsx` | Sección de video por producto |
| `features/store/data/products.ts` | `youtube_url` en `StoreProductDetail` |
| `features/catalog/actions/product-actions.ts` | Parse y validación de `youtube_url` |
| `features/catalog/components/product-form.tsx` | Campo URL de YouTube |
| `lib/db/database.types.ts` | Columna `youtube_url` en tipos de `products` |

---

## Validaciones

```
npm run lint      → 0 errores
npm run typecheck → 0 errores
npm run build     → compilación exitosa
Migraciones:      → 36/36 sincronizadas
```

---

## Riesgos pendientes

1. **`inStock` siempre `true`** en la tienda pública — pendiente de política RLS para `anon` en `inventory_balances` o función SECURITY DEFINER pública.
2. **`reorder_point`/`reorder_quantity`** sin inputs en el formulario de producto — alertas de inventario no configurables por UI.
3. **Email de invitación de usuarios** requiere SMTP configurado en Supabase — sin SMTP el usuario se crea pero no recibe email.
4. **video DJI Mic Mini en home** está hardcodeado como constante en `app/page.tsx` — si el video cambia, requiere editar el código. Alternativa: agregar a configuración del negocio.
