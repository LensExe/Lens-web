import { Award } from "lucide-react";
import { cn } from "@lens/ui";
import { rankById } from "@/lib/achievements";
import type { RankId } from "@/types";

/** Small rank pill — reused on the public profile, browse card, and dashboard. */
export function RankBadge({
  rank,
  className,
}: {
  rank: RankId;
  className?: string;
}) {
  const tier = rankById(rank);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tier.className,
        className
      )}
    >
      <Award className="size-3.5" />
      {tier.name}
    </span>
  );
}
