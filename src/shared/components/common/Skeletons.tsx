import { Skeleton } from '@/shared/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-sm p-6 space-y-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="glass-sm p-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-sm overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-12 pb-8 px-6 text-center">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-9 w-48 mx-auto" />
        <div className="flex justify-center gap-4 mt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 space-y-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        {[...Array(2)].map((_, catIdx) => (
          <div key={catIdx} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-sm p-5 flex gap-4">
                <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

