import { Skeleton } from "@lens/ui";

interface PhotographerCardSkeletonProps {
  /** Cover height in px — varied to mimic the masonry layout. */
  coverHeight?: number;
}

// Fallback skeleton rendered by Boneyard's <Skeleton> while data loads.
export function PhotographerCardSkeleton({ coverHeight = 240 }: PhotographerCardSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card">
      <Skeleton className="w-full rounded-none" style={{ height: coverHeight }} />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}
