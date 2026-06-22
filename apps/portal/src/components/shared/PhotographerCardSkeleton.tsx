import { Skeleton } from "@lens/ui";

interface PhotographerCardSkeletonProps {
  /** Cover height in px — varied to mimic the masonry layout. */
  coverHeight?: number;
}

// Fallback skeleton rendered by Boneyard's <Skeleton> while data loads.
// Matches the image-forward card: one rounded block.
export function PhotographerCardSkeleton({ coverHeight = 240 }: PhotographerCardSkeletonProps) {
  return (
    <Skeleton
      className="w-full rounded-3xl"
      style={{ height: coverHeight }}
    />
  );
}
