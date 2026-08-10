import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardBody } from '@/components/ui/card'

export default function LoadingProductEdit() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Images skeleton */}
      <Card padding={false}>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Form skeleton */}
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="mb-4 h-4 w-24" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
