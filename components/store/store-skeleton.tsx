export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lz-border bg-lz-surface">
      <div className="aspect-square animate-shimmer" />
      <div className="space-y-2.5 p-4">
        <div className="h-2.5 w-14 animate-shimmer rounded-full" />
        <div className="h-4 w-full animate-shimmer rounded-lg" />
        <div className="h-4 w-3/4 animate-shimmer rounded-lg" />
        <div className="mt-3 border-t border-lz-border/40 pt-3">
          <div className="h-5 w-24 animate-shimmer rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Image */}
      <div className="aspect-square animate-shimmer rounded-2xl" />

      {/* Info */}
      <div className="space-y-5">
        <div className="h-3 w-20 animate-shimmer rounded-full" />
        <div className="space-y-2">
          <div className="h-8 w-full animate-shimmer rounded-xl" />
          <div className="h-8 w-2/3 animate-shimmer rounded-xl" />
        </div>
        <div className="h-4 w-28 animate-shimmer rounded-lg" />
        <div className="h-10 w-36 animate-shimmer rounded-xl" />
        <div className="h-4 w-full animate-shimmer rounded-lg" />
        <div className="h-4 w-5/6 animate-shimmer rounded-lg" />
        <div className="h-4 w-4/6 animate-shimmer rounded-lg" />
        <div className="h-12 w-full animate-shimmer rounded-xl" />
      </div>
    </div>
  )
}
