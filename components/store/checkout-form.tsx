'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { checkoutFormAction } from '@/features/store/actions/checkout-action'
import type { CheckoutFormState, DeliveryMethod } from '@/features/store/actions/checkout-action'
import { CheckoutSummary } from '@/components/store/checkout-summary'
import { CheckoutValidationAlert } from '@/components/store/checkout-validation-alert'

// ─── Subcomponentes internos ───────────────────────────────────────────────────

type FieldProps = {
  id:           string
  label:        string
  name:         string
  type?:        string
  required?:    boolean
  placeholder?: string
  error?:       string
  hint?:        string
  autoComplete?: string
  inputMode?:   React.HTMLAttributes<HTMLInputElement>['inputMode']
}

function Field({ id, label, name, type = 'text', required, placeholder, error, hint, autoComplete, inputMode }: FieldProps) {
  const errId  = error ? `${id}-err`  : undefined
  const hintId = hint  ? `${id}-hint` : undefined
  const describedBy = [errId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-lz-muted">
        {label}
        {required && <span className="ml-0.5 text-lz-danger" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (obligatorio)</span>}
        {hint && !required && <span className="ml-1 font-normal text-lz-muted/60">(opcional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={[
          'h-11 w-full rounded-xl border bg-lz-bg px-4 text-sm text-lz-text',
          'placeholder:text-lz-muted/50 transition-all',
          'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
          error
            ? 'border-lz-danger focus:border-lz-danger'
            : 'border-lz-border focus:border-lz-primary',
        ].join(' ')}
      />
      {hint && (
        <p id={hintId} className="text-[10px] text-lz-muted/70">{hint}</p>
      )}
      {error && (
        <p id={errId} role="alert" className="text-xs text-lz-danger">{error}</p>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-lz-border bg-lz-surface p-6 space-y-4">
      <h2 className="text-sm font-semibold text-lz-text">{title}</h2>
      {children}
    </div>
  )
}

// ─── Opciones de modalidad de entrega ─────────────────────────────────────────

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; description: string }[] = [
  { value: 'pickup',   label: 'Retiro acordado',  description: 'Coordina un punto de encuentro con el equipo' },
  { value: 'local',    label: 'Entrega local',    description: 'Entrega en tu ciudad (costo por confirmar)' },
  { value: 'national', label: 'Envío nacional',   description: 'Envío a todo el país (costo por confirmar)' },
]

// ─── Claves de sessionStorage ─────────────────────────────────────────────────

const SESSION_IDEM_KEY  = 'lz_checkout_idem'
const SESSION_ORDER_KEY = 'lz_checkout_last_order'

// ─── Componente principal ─────────────────────────────────────────────────────

export function CheckoutForm() {
  const { items, total, clear, hydrated } = useCart()
  const router = useRouter()

  const [state, action, pending] = useActionState<CheckoutFormState, FormData>(
    checkoutFormAction,
    undefined,
  )

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')

  const errors = (state && 'errors' in state) ? state.errors : {}

  // Inicialización: clave de idempotencia + recuperación de pedido previo
  // Patrón async IIFE para evitar setState síncrono en el cuerpo del effect
  useEffect(() => {
    void (async () => {
      try {
        // Recuperación: si hay un pedido confirmado cuya redirección falló
        const saved = sessionStorage.getItem(SESSION_ORDER_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as { orderNumber: string; confirmationToken: string }
          if (parsed.orderNumber && parsed.confirmationToken) {
            clear()
            router.replace(
              `/order-confirmation/${parsed.orderNumber}?token=${parsed.confirmationToken}`
            )
            return
          }
        }

        // Generar o recuperar clave de idempotencia para esta sesión
        let key = sessionStorage.getItem(SESSION_IDEM_KEY)
        if (!key) {
          key = crypto.randomUUID()
          sessionStorage.setItem(SESSION_IDEM_KEY, key)
        }
        setIdempotencyKey(key)
      } catch {
        // sessionStorage no disponible (modo privado extremo, etc.)
        setIdempotencyKey(crypto.randomUUID())
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirigir a confirmación tras éxito
  useEffect(() => {
    if (!state || !('success' in state)) return

    try {
      sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify({
        orderNumber:       state.orderNumber,
        confirmationToken: state.confirmationToken,
      }))
      sessionStorage.removeItem(SESSION_IDEM_KEY)
    } catch { /* no bloquear flujo si sessionStorage falla */ }

    clear()
    router.push(
      `/order-confirmation/${state.orderNumber}?token=${state.confirmationToken}`
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Skeleton mientras el carrito hidrata o se genera la clave de sesión
  if (!hydrated || !idempotencyKey) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3 order-2 lg:order-1">
          <div className="h-52 animate-pulse rounded-2xl bg-lz-surface" />
          <div className="h-64 animate-pulse rounded-2xl bg-lz-surface" />
          <div className="h-28 animate-pulse rounded-2xl bg-lz-surface" />
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="h-72 animate-pulse rounded-2xl bg-lz-surface" />
        </div>
      </div>
    )
  }

  // Carrito vacío
  if (items.length === 0) {
    return <CheckoutValidationAlert type="empty" />
  }

  const currency         = items[0]?.currency ?? 'USD'
  const requiresAddress  = deliveryMethod === 'local' || deliveryMethod === 'national'
  const canSubmit        = !pending && items.length > 0 && !!idempotencyKey

  return (
    <form
      id="checkout-form"
      action={action}
      className="grid grid-cols-1 gap-8 lg:grid-cols-5"
      noValidate
    >
      {/* ── Columna izquierda: secciones del formulario ───────────────────── */}
      <div className="space-y-6 lg:col-span-3 order-2 lg:order-1">

        {/* Alertas globales */}
        {errors._ && (
          <CheckoutValidationAlert type="error" message={errors._} />
        )}
        {errors.items && (
          <CheckoutValidationAlert type="unavailable" message={errors.items} />
        )}

        {/* 1. Información de contacto */}
        <SectionCard title="Información de contacto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="cf-firstName" label="Nombre" name="firstName" required
              placeholder="Juan" error={errors.firstName} autoComplete="given-name"
            />
            <Field
              id="cf-lastName" label="Apellido" name="lastName"
              placeholder="Pérez" error={errors.lastName} autoComplete="family-name"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="cf-phone" label="Teléfono" name="phone" required
              type="tel" placeholder="+58 412 0000000" error={errors.phone}
              autoComplete="tel" inputMode="tel"
            />
            <Field
              id="cf-whatsapp" label="WhatsApp" name="whatsapp"
              type="tel" placeholder="Si es diferente al teléfono" error={errors.whatsapp}
              autoComplete="tel" inputMode="tel"
              hint="Déjalo vacío si es el mismo número"
            />
          </div>

          <Field
            id="cf-email" label="Correo electrónico" name="email"
            type="email" placeholder="juan@correo.com" error={errors.email}
            autoComplete="email" hint="Opcional"
          />
        </SectionCard>

        {/* 2. Entrega */}
        <SectionCard title="Entrega">
          <Field
            id="cf-city" label="Ciudad" name="city" required
            placeholder="Caracas" error={errors.city} autoComplete="address-level2"
          />

          {/* Modalidad de entrega */}
          <div>
            <p className="mb-2 text-xs font-medium text-lz-muted">
              Modalidad
              <span className="ml-0.5 text-lz-danger" aria-hidden="true">*</span>
              <span className="sr-only"> (obligatorio)</span>
            </p>
            <div
              role="radiogroup"
              aria-label="Modalidad de entrega"
              aria-describedby={errors.deliveryMethod ? 'cf-delivery-err' : undefined}
              className="space-y-2"
            >
              {DELIVERY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                    deliveryMethod === opt.value
                      ? 'border-lz-primary/60 bg-lz-primary/10'
                      : 'border-lz-border hover:border-lz-primary/30',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={opt.value}
                    checked={deliveryMethod === opt.value}
                    onChange={() => setDeliveryMethod(opt.value)}
                    className="mt-0.5 shrink-0 accent-lz-primary"
                    aria-describedby={errors.deliveryMethod ? 'cf-delivery-err' : undefined}
                  />
                  <div>
                    <p className="text-sm font-medium text-lz-text">{opt.label}</p>
                    <p className="text-xs text-lz-muted">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.deliveryMethod && (
              <p id="cf-delivery-err" role="alert" className="mt-1.5 text-xs text-lz-danger">
                {errors.deliveryMethod}
              </p>
            )}
          </div>

          {/* Dirección — visible solo cuando requiere entrega */}
          {requiresAddress ? (
            <Field
              id="cf-address" label="Dirección" name="address" required
              placeholder="Av. Principal, Edificio X, Piso 2, Apto 2A"
              error={errors.address} autoComplete="street-address"
            />
          ) : (
            <input type="hidden" name="address" value="" />
          )}

          {/* Punto de referencia — opcional siempre */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-reference" className="text-xs font-medium text-lz-muted">
              Punto de referencia
              <span className="ml-1 font-normal text-lz-muted/60">(opcional)</span>
            </label>
            <input
              id="cf-reference"
              name="reference"
              type="text"
              placeholder="Cerca del centro comercial X, frente al banco Y…"
              className="h-11 w-full rounded-xl border border-lz-border bg-lz-bg px-4 text-sm text-lz-text placeholder:text-lz-muted/50 focus:border-lz-primary focus:outline-none focus:ring-2 focus:ring-lz-primary/50 transition-all"
            />
          </div>
        </SectionCard>

        {/* 3. Notas */}
        <SectionCard title="Notas del pedido">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-notes" className="text-xs font-medium text-lz-muted">
              Comentarios
              <span className="ml-1 font-normal text-lz-muted/60">(opcional, máx. 500 caracteres)</span>
            </label>
            <textarea
              id="cf-notes"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Instrucciones especiales, horario preferido, etc."
              aria-describedby={errors.notes ? 'cf-notes-err' : undefined}
              aria-invalid={!!errors.notes}
              className={[
                'w-full resize-none rounded-xl border bg-lz-bg px-4 py-3 text-sm text-lz-text',
                'placeholder:text-lz-muted/50 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-lz-primary/50',
                errors.notes
                  ? 'border-lz-danger focus:border-lz-danger'
                  : 'border-lz-border focus:border-lz-primary',
              ].join(' ')}
            />
            {errors.notes && (
              <p id="cf-notes-err" role="alert" className="text-xs text-lz-danger">{errors.notes}</p>
            )}
          </div>
        </SectionCard>

        {/* 4. Aviso de coordinación */}
        <div className="rounded-2xl border border-lz-border/40 bg-lz-surface/50 px-5 py-4">
          <p className="text-xs leading-relaxed text-lz-muted">
            Al registrar el pedido confirmas que la{' '}
            <strong className="text-lz-text">disponibilidad, pago y entrega</strong>{' '}
            se coordinarán por{' '}
            <strong className="text-lz-text">WhatsApp</strong>{' '}
            con el equipo de Lanz Technology.
            No se realiza ningún cobro inmediato.
          </p>
        </div>
      </div>

      {/* ── Columna derecha: resumen sticky ───────────────────────────────── */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <CheckoutSummary
          items={items}
          total={total}
          deliveryMethod={deliveryMethod}
          submitting={pending}
          canSubmit={canSubmit}
        />
      </div>

      {/* ── Campos ocultos ────────────────────────────────────────────────── */}
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="currency"       value={currency} />
      <input type="hidden" name="items"          value={JSON.stringify(
        items.map(i => ({ productId: i.id, quantity: i.quantity }))
      )} />

      {/* Honeypot: visible solo para bots, invisible para humanos */}
      <div aria-hidden="true" className="absolute -left-[9999px] opacity-0 pointer-events-none" tabIndex={-1}>
        <label htmlFor="cf-website">Sitio web</label>
        <input id="cf-website" name="website" type="text" autoComplete="off" tabIndex={-1} />
      </div>
    </form>
  )
}
