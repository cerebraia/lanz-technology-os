'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ToastProvider, useToast } from '@/components/ui/toast'

// ─── Toast demo ───────────────────────────────────────────────────────────────

function ToastTriggers() {
  const { toast } = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => toast('Operación completada con éxito', 'success')}>
        Success
      </Button>
      <Button size="sm" variant="ghost" onClick={() => toast('Revisa esta acción antes de continuar', 'warning')}>
        Warning
      </Button>
      <Button size="sm" variant="danger" onClick={() => toast('Ha ocurrido un error inesperado', 'danger')}>
        Danger
      </Button>
      <Button size="sm" variant="secondary" onClick={() => toast('El sistema procesará esto en breve', 'info')}>
        Info
      </Button>
    </div>
  )
}

// ─── Modal demo ───────────────────────────────────────────────────────────────

function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirmar acción"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-lz-muted leading-relaxed">
          Este es un modal de ejemplo del Design System. Soporta cierre con la tecla{' '}
          <kbd className="rounded border border-lz-border bg-lz-border/60 px-1 py-0.5 font-mono text-xs text-lz-text">
            Escape
          </kbd>
          , clic fuera del panel y botón X.
        </p>
      </Modal>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function InteractiveDemo() {
  return (
    <ToastProvider>
      <div className="space-y-10">
        <DemoSection
          title="Modal"
          description="Overlay accesible con backdrop, Escape y gestión de scroll."
        >
          <ModalDemo />
        </DemoSection>

        <DemoSection
          title="Toast"
          description="Notificaciones temporales con auto-dismiss a los 4 segundos."
        >
          <ToastTriggers />
        </DemoSection>
      </div>
    </ToastProvider>
  )
}

function DemoSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-lz-text">{title}</p>
        <p className="text-xs text-lz-muted">{description}</p>
      </div>
      <div className="rounded-lg border border-lz-border/50 bg-lz-bg p-4">
        {children}
      </div>
    </div>
  )
}
