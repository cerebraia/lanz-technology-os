'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import {
  IconHome, IconGrid, IconBox, IconCart, IconClipboard, IconGlobe,
  IconUsers, IconDollar, IconMegaphone, IconBar, IconSettings,
  IconAlertTriangle, IconChevronLeft, IconChevronRight, IconChevronDown,
  IconX, IconLogOut, IconSend, IconCircleCheck, IconCircleDot,
} from '@/components/icons'
import { NAV_GROUPS, type NavGroup, type NavChild, type NavRole } from '@/config/admin-navigation'

export type { NavRole }

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home:         IconHome,
  grid:         IconGrid,
  box:          IconBox,
  cart:         IconCart,
  clipboard:    IconClipboard,
  globe:        IconGlobe,
  users:        IconUsers,
  dollar:       IconDollar,
  megaphone:    IconMegaphone,
  bar:          IconBar,
  settings:     IconSettings,
  alert:        IconAlertTriangle,
  send:         IconSend,
  'circle-check': IconCircleCheck,
  'circle-dot':   IconCircleDot,
}

function NavIcon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  const Comp = ICON_MAP[name] ?? IconBox
  return <Comp size={size} className={className} />
}

// ─── Route matching ───────────────────────────────────────────────────────────

function isItemActive(href: string, pathname: string, exact?: boolean): boolean {
  // Normalize: strip trailing slash
  const norm = (p: string) => p.replace(/\/$/, '') || '/'
  const h = norm(href)
  const p = norm(pathname)

  if (exact) return p === h

  // Special roots: only active in exact path or direct [id] children
  const EXACT_ROOTS = ['/admin/inventory', '/admin/orders', '/admin/sales', '/admin/crm/customers', '/admin/marketing', '/admin/reports', '/admin/automations', '/admin/settings']
  if (EXACT_ROOTS.includes(h)) {
    return p === h || new RegExp(`^${h.replace(/\//g, '\\/')}\\/[\\w-]+$`).test(p)
  }

  return p === h || p.startsWith(h + '/')
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if (group.href) return isItemActive(group.href, pathname, true)
  return (group.children ?? []).some(c => isItemActive(c.href, pathname, c.exact))
}

// ─── Role / permission filter ─────────────────────────────────────────────────

function groupVisible(group: NavGroup, userRoles: NavRole[]): boolean {
  if (!group.roles) return true
  if (userRoles.length === 0) return true  // sin roles → admin (fallback)
  return userRoles.some(r => group.roles!.includes(r))
}

function childVisible(child: NavChild & { roles?: NavRole[] }, userRoles: NavRole[]): boolean {
  if (!child.roles) return true
  if (userRoles.length === 0) return true
  return userRoles.some(r => (child.roles!).includes(r))
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lanz-admin-navigation'

function loadOpenState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  catch { return {} }
}

function saveOpenState(state: Record<string, boolean>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }
  catch { /* ignore */ }
}

// ─── Tooltip (sidebar colapsado) ─────────────────────────────────────────────

function Tooltip({ label }: { label: string }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-lz-border bg-lz-sidebar px-3 py-1.5 text-xs text-lz-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
    >
      {label}
    </div>
  )
}

// ─── NavigationGroup ─────────────────────────────────────────────────────────

function NavigationGroup({
  group,
  isCollapsed,
  userRoles,
  onNavigate,
}: {
  group:       NavGroup
  isCollapsed: boolean
  userRoles:   NavRole[]
  onNavigate?: () => void
}) {
  const pathname  = usePathname()
  const active    = isGroupActive(group, pathname)

  const visibleChildren = (group.children ?? []).filter(c =>
    childVisible(c as NavChild & { roles?: NavRole[] }, userRoles)
  )

  // "manualOpen" guarda lo que el usuario eligió explícitamente.
  // Si el grupo está activo (por pathname), siempre se muestra abierto
  // independientemente del valor guardado.
  const [manualOpen, setManualOpen] = useState<boolean>(() => {
    const saved = loadOpenState()
    return saved[group.id] ?? false
  })

  // El grupo está abierto si es activo O si el usuario lo abrió manualmente.
  const open = active || manualOpen

  const toggle = useCallback(() => {
    setManualOpen(prev => {
      // Si el grupo está activo, el toggle solo afecta manualOpen
      // (aunque el grupo siempre se mostrará abierto por `active`).
      const next = !prev
      const saved = loadOpenState()
      saved[group.id] = next
      saveOpenState(saved)
      return next
    })
  }, [group.id])

  // ── Dashboard (sin hijos) ───────────────────────────────────────────────────
  if (group.href && !group.children) {
    const isActive = isItemActive(group.href, pathname, true)
    return (
      <li>
        <div className="group relative">
          <Link
            href={group.href}
            onClick={onNavigate}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-lz-primary/15 text-lz-accent'
                : 'text-lz-muted hover:bg-lz-border/60 hover:text-lz-text',
            ].join(' ')}
          >
            <NavIcon
              name={group.icon}
              size={18}
              className={['shrink-0', isActive ? 'text-lz-accent' : 'text-lz-muted'].join(' ')}
            />
            {!isCollapsed && <span className="truncate">{group.label}</span>}
          </Link>
          {isCollapsed && <Tooltip label={group.label} />}
        </div>
      </li>
    )
  }

  // ── Grupos colapsados: solo icono con tooltip ───────────────────────────────
  if (isCollapsed) {
    return (
      <li>
        <div className="group relative">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={group.label}
            className={[
              'flex w-full items-center justify-center rounded-lg px-3 py-2 transition-colors',
              active ? 'text-lz-accent' : 'text-lz-muted hover:bg-lz-border/60 hover:text-lz-text',
            ].join(' ')}
          >
            <NavIcon
              name={group.icon}
              size={18}
              className={active ? 'text-lz-accent' : 'text-lz-muted'}
            />
          </button>
          <Tooltip label={group.label} />
        </div>
      </li>
    )
  }

  // ── Grupo expandido ─────────────────────────────────────────────────────────
  return (
    <li>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`nav-${group.id}`}
        className={[
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-lz-primary/10 text-lz-accent'
            : 'text-lz-muted hover:bg-lz-border/60 hover:text-lz-text',
        ].join(' ')}
      >
        <NavIcon
          name={group.icon}
          size={18}
          className={['shrink-0', active ? 'text-lz-accent' : 'text-lz-muted'].join(' ')}
        />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <IconChevronDown
          size={14}
          className={[
            'shrink-0 transition-transform duration-200',
            open ? 'rotate-0' : '-rotate-90',
            active ? 'text-lz-accent' : 'text-lz-muted/60',
          ].join(' ')}
        />
      </button>

      {/* Submenú */}
      {open && visibleChildren.length > 0 && (
        <ul id={`nav-${group.id}`} className="mt-0.5 space-y-0.5 pl-9">
          {visibleChildren.map(child => {
            const childActive = isItemActive(child.href, pathname, child.exact)
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={[
                    'block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    childActive
                      ? 'text-lz-accent'
                      : 'text-lz-muted hover:text-lz-text',
                  ].join(' ')}
                >
                  {childActive && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-lz-accent align-middle" aria-hidden />
                  )}
                  {child.label}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

type SidebarProps = {
  isCollapsed:      boolean
  isMobileOpen:     boolean
  onToggleCollapse: () => void
  onCloseMobile:    () => void
  signOutAction:    () => Promise<void>
  userRoles?:       NavRole[]
}

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
  signOutAction,
  userRoles = [],
}: SidebarProps) {
  const visibleGroups = NAV_GROUPS.filter(g => groupVisible(g, userRoles))

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-lz-border bg-lz-sidebar',
        'transition-all duration-200 ease-in-out',
        'lg:relative lg:z-auto lg:translate-x-0',
        isCollapsed ? 'w-16' : 'w-64',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-lz-border px-3">
        <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lz-primary text-[11px] font-black text-white">
            L
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-lz-muted">
                Lanz Technology
              </p>
              <p className="text-[10px] font-medium text-lz-primary">
                Centro de operaciones
              </p>
            </div>
          )}
        </div>

        {/* Desktop: toggle collapse */}
        <button
          type="button"
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          onClick={onToggleCollapse}
          className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text lg:flex"
        >
          {isCollapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
        </button>

        {/* Mobile: close */}
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onCloseMobile}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lz-muted transition-colors hover:bg-lz-border hover:text-lz-text lg:hidden"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        aria-label="Navegación principal"
      >
        <ul className="space-y-0.5">
          {visibleGroups.map(group => (
            <NavigationGroup
              key={group.id}
              group={group}
              isCollapsed={isCollapsed}
              userRoles={userRoles}
              onNavigate={isMobileOpen ? onCloseMobile : undefined}
            />
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-lz-border px-2 py-3">
        <div className="group relative">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-lz-muted transition-colors hover:bg-lz-danger/10 hover:text-lz-danger"
            >
              <IconLogOut size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Cerrar sesión</span>}
            </button>
          </form>
          {isCollapsed && <Tooltip label="Cerrar sesión" />}
        </div>
      </div>
    </aside>
  )
}
