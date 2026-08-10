export type UserRole = 'administrator' | 'salesperson' | 'operator'

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: 'Administrador',
  salesperson:   'Vendedor',
  operator:      'Operador',
}

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as UserRole,
  label,
}))
