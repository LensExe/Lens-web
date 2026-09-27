import { Skeleton } from "@lens/ui";

/** Placeholder while a lazily loaded workspace page downloads. */
export function PageFallback() {
  return (
    <div className="w-full max-w-[1440px] space-y-4 px-5 py-10 md:px-8">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
