import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { AchievementStats } from "@/types";

/**
 * The profile's trust numbers as one quiet row: big figures in ink, a short
 * label under each, hairline dividers between them (2×2 on phones). Only the
 * rating star carries colour.
 */
export function ProfileStats({
  rating,
  reviewCount,
  stats,
}: {
  rating: number;
  reviewCount: number;
  stats: AchievementStats;
}) {
  const items: { value: ReactNode; label: string }[] = [
    {
      value: (
        <>
          <Star className="size-5 fill-ember text-ember" aria-hidden />
          {rating.toFixed(1)}
        </>
      ),
      label: `${reviewCount} đánh giá`,
    },
    { value: `${stats.fiveStarPct}%`, label: "đánh giá 5 sao" },
    { value: stats.completedSessions, label: "buổi đã chụp" },
    { value: stats.returningClients, label: "khách quay lại" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:gap-0 sm:divide-x sm:divide-border">
      {items.map(({ value, label }) => (
        <div key={label} className="flex flex-col-reverse sm:px-7 sm:first:pl-0 sm:last:pr-0">
          <dt className="mt-0.5 text-sm text-muted-foreground">{label}</dt>
          <dd className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
