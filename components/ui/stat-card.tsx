import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

type Trend = {
  value: number
  label: string
  up: boolean
}

type StatCardProps = {
  label: string
  value: string
  helperText?: string
  icon?: ReactNode
  badge?: ReactNode
  trend?: Trend
  loading?: boolean
}

export function StatCard({
  label,
  value,
  helperText,
  icon,
  badge,
  trend,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-xl border border-lz-border bg-lz-surface p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-lz-border bg-lz-surface p-5">
      <div className="flex items-start justify-between gap-2">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lz-primary/15 text-lz-accent">
            {icon}
          </div>
        )}
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <p
        className={[
          'text-2xl font-semibold tracking-tight text-lz-text',
          icon || badge ? 'mt-4' : '',
        ].join(' ')}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-lz-muted">{label}</p>
      {(helperText || trend) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {helperText && (
            <p className="text-[11px] text-lz-muted">{helperText}</p>
          )}
          {trend && (
            <span
              className={[
                'text-xs font-medium',
                trend.up ? 'text-lz-success' : 'text-lz-danger',
              ].join(' ')}
            >
              {trend.up ? '↑' : '↓'} {trend.value}% {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
