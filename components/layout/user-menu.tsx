'use client'

import { useState } from 'react'
import { IconChevronDown, IconUser, IconLogOut } from '@/components/icons'

type UserMenuProps = {
  fullName: string
  initials: string
  signOutAction: () => Promise<void>
}

export function UserMenu({ fullName, initials, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Menú de usuario"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg border border-lz-border bg-lz-sidebar px-2 py-1 transition-colors hover:border-lz-primary/40"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-lz-primary/30 bg-lz-primary/20 text-[10px] font-bold text-lz-accent">
          {initials}
        </div>
        <span className="hidden max-w-[100px] truncate text-xs text-lz-muted sm:block">
          {fullName}
        </span>
        <IconChevronDown
          size={12}
          className={['text-lz-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>

      {open && (
        <>
          {/* Click-outside trap */}
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-[60] mt-1.5 w-52 overflow-hidden rounded-xl border border-lz-border bg-lz-sidebar shadow-xl shadow-black/40">
            {/* User info */}
            <div className="flex items-center gap-3 border-b border-lz-border px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lz-primary/30 bg-lz-primary/20 text-xs font-bold text-lz-accent">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-lz-text">{fullName}</p>
                <p className="flex items-center gap-1 text-[10px] text-lz-muted">
                  <span className="h-1 w-1 rounded-full bg-lz-success" />
                  En línea
                </p>
              </div>
            </div>

            {/* Profile — not yet implemented */}
            <div className="px-2 py-1.5">
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-lz-muted/50 cursor-not-allowed"
              >
                <IconUser size={14} />
                Mi perfil
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-lz-border px-2 py-1.5">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-lz-muted transition-colors hover:bg-lz-danger/10 hover:text-lz-danger"
                >
                  <IconLogOut size={14} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
