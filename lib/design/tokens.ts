/**
 * Design tokens oficiales de Lanz Technology OS.
 * Sincronizados con los CSS custom properties en globals.css.
 * Usar las clases de Tailwind (bg-lz-primary, text-lz-text, etc.) en los componentes.
 * No hardcodear valores hex directamente en los componentes.
 */

export const colors = {
  primary:        '#7B2FFF',
  primaryHover:   '#9A4DFF',
  accent:         '#B56CFF',
  background:     '#08060F',
  surface:        '#171522',
  sidebar:        '#0B0A12',
  text:           '#F8F8FF',
  muted:          '#A8A3B8',
  border:         '#2A2438',
  success:        '#22C55E',
  warning:        '#F59E0B',
  danger:         '#EF4444',
  info:           '#3B82F6',
} as const

export const typography = {
  family: {
    sans: 'Poppins, system-ui, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
  size: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
  },
  weight: {
    light:    300,
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },
  lineHeight: {
    tight:  1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export const spacing = {
  sidebar:          '15rem',  // 240px — sidebar expandido
  sidebarCollapsed: '4rem',   // 64px  — sidebar colapsado
  header:           '3.5rem', // 56px  — altura del header
} as const

export const radius = {
  sm:   '0.375rem',  // 6px
  md:   '0.625rem',  // 10px
  lg:   '0.75rem',   // 12px
  xl:   '1rem',      // 16px
  full: '9999px',
} as const

export const transition = {
  fast:    'all 150ms ease',
  base:    'all 200ms ease',
  slow:    'all 300ms ease',
  sidebar: 'width 200ms ease, opacity 200ms ease',
} as const

export const shadow = {
  sm:   '0 1px 2px 0 rgb(0 0 0 / 0.5)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.6)',
  lg:   '0 10px 15px -3px rgb(0 0 0 / 0.7)',
  glow: '0 0 40px rgb(123 47 255 / 0.15)',
} as const

export const zIndex = {
  sidebar:  40,
  header:   50,
  dropdown: 60,
  modal:    70,
  toast:    80,
} as const

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
} as const

export const iconSizes = {
  xs:  12,
  sm:  14,
  md:  16,
  lg:  18,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
} as const

export type Color = keyof typeof colors
