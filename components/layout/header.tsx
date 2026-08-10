'use client'

import { IconMenu, IconSearch } from '@/components/icons'
import { AutoBreadcrumb } from '@/components/layout/breadcrumb'
import { UserMenu } from '@/components/layout/user-menu'

type HeaderProps = {
  fullName: string
  initials: string
  onOpenMobile: () => void
  signOutAction: () => Promise<void>
}

export function Header({ fullName, initials, onOpenMobile, signOutAction }: HeaderProps) {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-4 border-b border-lz-border bg-lz-sidebar px-4 sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={onOpenMobile}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text lg:hidden"
      >
        <IconMenu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 overflow-hidden">
        <AutoBreadcrumb />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Global search — placeholder */}
        <div className="relative hidden sm:flex">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted"
          />
          <input
            type="search"
            placeholder="Buscar…"
            readOnly
            className="h-8 w-44 cursor-default rounded-lg border border-lz-border bg-lz-bg pl-8 pr-3 text-xs text-lz-muted placeholder:text-lz-muted/60 focus:outline-none"
          />
        </div>

        {/* Online status */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-lz-success" />
          <span className="text-xs text-lz-muted">En línea</span>
        </div>

        {/* User menu */}
        <UserMenu
          fullName={fullName}
          initials={initials}
          signOutAction={signOutAction}
        />
      </div>
    </header>
  )
}
