# Principios de seguridad

Define los principios de seguridad que guiarán la implementación del sistema.

**Estado: No implementados.** Este documento es la referencia para las fases de implementación.

---

## Principios base

### Mínimo privilegio

Cada usuario solo tiene acceso a las operaciones que su rol y permisos le otorgan explícitamente. El acceso predeterminado es denegado.

### Seguridad desde el diseño

La seguridad no se agrega al final. Cada módulo se diseña considerando quién puede acceder, qué puede hacer y qué queda registrado.

### Defensa en profundidad

No se depende de una sola capa de seguridad. Cada capa añade protección adicional: autenticación, autorización en servidor, RLS en base de datos, validación de entradas.

---

## Autenticación

- Gestionada por Supabase Auth (Fase 3).
- Sesiones basadas en JWT con refresco automático.
- No se almacenan contraseñas en la aplicación; Supabase las gestiona.
- Rutas del centro de operaciones requieren sesión válida.
- La tienda pública no requiere autenticación (salvo área de cuenta en fases futuras).

---

## Autorización

- Los permisos se verifican **en el servidor**, nunca solo en el cliente.
- Los permisos controlan **acciones específicas**, no solo acceso a páginas.
- Una página protegida con middleware no es suficiente si la Server Action no verifica también.
- La verificación de permisos ocurre en la capa de casos de uso, antes de ejecutar cualquier operación.

---

## Permisos por acción

Ejemplos de granularidad prevista:

```
inventory:view         — ver inventario
inventory:movement     — crear movimientos
inventory:adjust       — crear ajustes de inventario
orders:create          — crear pedidos
orders:cancel          — cancelar pedidos
orders:view_cost       — ver costos en pedidos
finance:view           — ver registros financieros
finance:create         — crear registros
reports:view           — consultar reportes
users:manage           — administrar usuarios
settings:edit          — modificar configuraciones
```

Los permisos se asignan a roles, y los roles a usuarios. Un usuario puede tener permisos adicionales o restringidos respecto a su rol base.

---

## Row-Level Security (RLS)

- Habilitado en todas las tablas de Supabase desde el inicio.
- Las políticas de RLS son la última línea de defensa; la autorización en servidor es la primera.
- No se accede a Supabase como superusuario desde el cliente.
- El `service_role_key` solo se usa en operaciones administrativas del servidor y nunca se expone al cliente.

---

## Validación de entradas

- Toda entrada del usuario se valida en el servidor antes de persistir.
- La validación en el cliente es auxiliar (UX), no de seguridad.
- Se utilizará un esquema de validación explícito (Zod u otro) para cada Server Action.
- Los datos de la tienda pública (formularios de contacto, pedidos) se validan con especial cuidado.

---

## Protección de secretos

- Ningún secreto se incluye en el código versionado.
- Las variables de entorno sin prefijo `NEXT_PUBLIC_` son exclusivas del servidor.
- El `SUPABASE_SERVICE_ROLE_KEY` nunca se expone al cliente.
- `.env`, `.env.local`, `.env.production` están en `.gitignore`.
- En CI/CD futuro, los secretos se gestionarán como variables de entorno de la plataforma.

---

## Auditoría

- Las operaciones sensibles generan registros de auditoría con: usuario, acción, entidad afectada, timestamp, datos antes y después.
- Operaciones auditadas incluyen: cambios de inventario, cancelaciones de pedidos, modificaciones financieras, cambios de permisos, configuraciones sensibles.
- Los registros de auditoría son inmutables.
- Solo administradores pueden consultar el log de auditoría.

---

## Formularios públicos (tienda)

- Los formularios de la tienda pública (contacto, pedidos) incluyen protección contra spam (rate limiting o CAPTCHA en fases futuras).
- Las entradas de la tienda se tratan como no confiables y se validan en servidor.
- No se expone información de la estructura interna en respuestas de error de la tienda.

---

## Operaciones administrativas

- Las operaciones destructivas (cancelar pedidos, ajustar inventario, eliminar usuarios) requieren confirmación explícita.
- Las operaciones con impacto financiero quedan registradas en auditoría.
- No existe eliminación real de registros históricos; solo marcado como inactivo o cancelado.

---

## Separación de datos por rol

| Dato | Administrator | Salesperson |
|---|---|---|
| Precio de venta | ✅ | ✅ |
| Costo de producto | ✅ | ❌ |
| Rentabilidad | ✅ | ❌ |
| Historial de pedidos | ✅ completo | ✅ sus pedidos |
| Datos de clientes | ✅ | ✅ básicos |
| Log de auditoría | ✅ | ❌ |
| Configuraciones | ✅ | ❌ |
| Finanzas completas | ✅ | ❌ |

---

## Gestión futura de sesiones

- Las sesiones expirarán y se renovarán automáticamente mediante Supabase Auth.
- Las sesiones inactivas se cerrarán tras un período configurable.
- El cierre de sesión invalida el token en servidor.
- Se evaluará si se requiere soporte multi-sesión por usuario.
