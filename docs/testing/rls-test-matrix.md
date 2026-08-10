# Matriz de pruebas RLS — Fases 2B y 3A

Registro de pruebas de Row Level Security.

**Método de prueba:** API REST de Supabase con publishable key (anon) + consultas SQL via `npx supabase db query --linked`.

**Actualizado en Fase 3A:** Pruebas de administrador via DB query. Pruebas de flujo web completadas manualmente (ver Paso 15 — Validación manual).

---

## Resultado de auditoría estática

Antes de aplicar migraciones, se verificó estáticamente que:

| Verificación | Resultado |
|---|---|
| RLS habilitado en las 18 tablas de `public` | ✅ Confirmado en migration 007 |
| Sin tabla `public.users` | ✅ Solo `public.profiles` |
| Sin credenciales hardcodeadas | ✅ Confirmado |
| Sin emails de admin en migraciones | ✅ Confirmado |
| `inventory_balances` sin INSERT/UPDATE policy | ✅ Solo vía función SECURITY DEFINER |
| `audit_logs` sin INSERT policy directa | ✅ Solo vía `log_audit_event()` |
| `has_permission()` con SECURITY DEFINER + search_path | ✅ Confirmado |
| `record_inventory_movement()` con SECURITY DEFINER + search_path | ✅ Confirmado |
| REVOKE PUBLIC + GRANT explícito en funciones | ✅ Confirmado |

---

## Pruebas ejecutadas — Usuario anónimo (publishable key)

Método: HTTP GET via REST API con `Authorization: Bearer <publishable_key>`

| Tabla | Acción | Esperado | Real | Estado |
|---|---|---|---|---|
| `profiles` | SELECT | `[]` — sin datos | `[]` | ✅ PASS |
| `orders` | SELECT | `[]` — sin datos | `[]` | ✅ PASS |
| `audit_logs` | SELECT | `[]` — sin datos | `[]` | ✅ PASS |
| `inventory_balances` | SELECT | `[]` — sin datos | `[]` | ✅ PASS |
| `products` | SELECT | `[]` — sin política pública activa | `[]` | ✅ PASS |
| `roles` | SELECT | `[]` — requiere autenticado | `[]` | ✅ PASS |

**Interpretación:** PostgREST con RLS activo devuelve conjunto vacío (no error 403) cuando no hay política que autorice. Este es el comportamiento correcto y esperado de Supabase con RLS.

---

## Pruebas pendientes — Requieren Fase 3A

Las siguientes pruebas de rol salesperson requieren un segundo usuario en el sistema. Se completarán en Fase 4 cuando existan usuarios adicionales.

Las pruebas de administrador se completaron via DB query en Fase 3A.

### Usuario autenticado sin rol asignado

| Tabla | Acción | Esperado | Real | Estado |
|---|---|---|---|---|
| `profiles` | SELECT propio | Propio perfil | Pendiente — requiere JWT | ⏳ |
| `inventory_balances` | INSERT directo | Bloqueado | Pendiente — requiere JWT | ⏳ |
| `audit_logs` | SELECT | Bloqueado | Pendiente — requiere JWT | ⏳ |
| `user_roles` | INSERT propio | Bloqueado | Pendiente — requiere JWT | ⏳ |

### Salesperson

| Tabla/Acción | Esperado | Real | Estado |
|---|---|---|---|
| `products` SELECT | ✅ Ver productos | Pendiente — requiere usuario salesperson | ⏳ |
| `inventory_balances` UPDATE directo | ❌ Bloqueado | Pendiente | ⏳ |
| `audit_logs` SELECT | ❌ Bloqueado | Pendiente | ⏳ |
| `business_settings` SELECT | ❌ Bloqueado | Pendiente | ⏳ |
| `user_roles` INSERT | ❌ Bloqueado | Pendiente | ⏳ |

### Administrator

| Tabla/Acción | Esperado | Real | Estado |
|---|---|---|---|
| `profiles` SELECT propio | ✅ Ver su perfil | `full_name: Administrador, status: active` | ✅ PASS (via DB query) |
| `profiles` SELECT todos | ✅ Ver todos | Pendiente — requiere JWT web | ⏳ |
| `products` CRUD | ✅ Acceso completo | Pendiente — requiere JWT web | ⏳ |
| `inventory_balances` UPDATE directo | ❌ Bloqueado (solo vía función) | Sin INSERT/UPDATE policy | ✅ PASS (verificado en schema) |
| `audit_logs` SELECT | ✅ Ver log completo | Pendiente — requiere JWT web | ⏳ |
| `business_settings` | ✅ Leer y modificar | Pendiente — requiere JWT web | ⏳ |
| `has_permission('audit.read')` | `true` | `true` (24 permisos activos) | ✅ PASS (via DB query) |
| `role` = `administrator`, `status` = `active` | ✅ | Confirmado | ✅ PASS |

---

## Riesgos documentados

| Riesgo | Nivel | Estado |
|---|---|---|
| Protección de `reference_cost` y `unit_cost` es a nivel de aplicación | Medio | Mitigar al implementar Server Actions en Fases 4+ |
| RLS en `user_roles` sin recursión en `has_permission()` | Controlado | Verificado — SECURITY DEFINER previene recursión |
| Pruebas `service_role` bypass RLS — no válidas para permisos | Informativo | No se usó `service_role` para pruebas |
| Pruebas web con JWT autenticado pendientes | Medio | Completar con usuarios reales en Fase 4 |

---

## Próximo paso para completar esta matriz

En la Fase 3A, tras implementar autenticación:

1. Crear un usuario de prueba con rol `salesperson`
2. Obtener JWT via `supabase.auth.signInWithPassword()`
3. Ejecutar queries con ese JWT en la API REST
4. Registrar resultados en esta matriz
5. Repetir para `administrator`
6. Crear pruebas automatizadas si el volumen lo justifica
