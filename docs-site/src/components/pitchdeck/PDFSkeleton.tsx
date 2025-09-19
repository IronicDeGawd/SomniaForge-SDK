import { Skeleton } from '@/components/ui/skeleton';

export const PDFSkeleton = () => {
  return (
    <div className="flex justify-center w-full h-full">
      <div className="relative">
        <div className="shadow-lg rounded-lg overflow-hidden bg-card">
          <div
            className="bg-background border border-border"
            style={{
              width: '600px',
              height: '776px',
              maxWidth: '90vw',
              maxHeight: '80vh'
            }}
          >
            <div className="p-8 space-y-4 h-full">
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
              </div>

              <div className="space-y-4 mt-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <div className="mt-8 space-y-2">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-3 w-1/3 mx-auto" />
              </div>

              <div className="space-y-3 mt-8">
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>

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