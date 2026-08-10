'use client'

import { useState } from 'react'
import { Sidebar, type NavRole } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileMenuBackdrop } from '@/components/layout/mobile-menu'

type User = { fullName: string; initials: string }

export function AdminShell({
  children,
  user,
  userRoles,
  signOutAction,
}: {
  children:     React.ReactNode
  user:         User
  userRoles?:   NavRole[]
  signOutAction: () => Promise<void>
}) {
  const [isCollapsed, setIsCollapsed]   = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-lz-bg">
      <MobileMenuBackdrop
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapse={() => setIsCollapsed(v => !v)}
        onCloseMobile={() => setIsMobileOpen(false)}
        signOutAction={signOutAction}
        userRoles={userRoles}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          fullName={user.fullName}
          initials={user.initials}
          onOpenMobile={() => setIsMobileOpen(true)}
          signOutAction={signOutAction}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
