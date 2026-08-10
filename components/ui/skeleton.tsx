type SkeletonProps = { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={['animate-pulse rounded-lg bg-lz-border/60', className].join(' ')}
      aria-hidden="true"
    />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
