import { Skeleton } from '@/components/ui/skeleton';

export const PDFSkeleton = () => {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <div className="shadow-lg rounded-lg overflow-hidden bg-card w-full">
          {/* Simulate PDF page skeleton with smaller height */}
          <div className="w-full bg-background border border-border h-96">
            <div className="p-8 space-y-4 h-full">
              {/* Title section */}
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
              </div>

              {/* Main content area */}
              <div className="space-y-4 mt-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Chart/diagram placeholder */}
              <div className="mt-8 space-y-2">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-3 w-1/3 mx-auto" />
              </div>

              {/* Bottom content */}
              <div className="space-y-3 mt-8">
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>

              {/* Footer */}
              <div className="mt-12 pt-4 border-t border-border">
                <Skeleton className="h-3 w-1/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};