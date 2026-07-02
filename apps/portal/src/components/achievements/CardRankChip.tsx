import { Award } from "lucide-react";
import { rankById } from "@/lib/achievements";
import type { RankId } from "@/types";

/** Translucent rank chip for the browse card's dark image overlay. Reads the
 *  rank from the roster payload (no per-card request). */
export function CardRankChip({ rank }: { rank?: RankId }) {
  if (!rank) return null;
  return (
    <span className="flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md">
      <Award className="size-3" />
      {rankById(rank).name}
    </span>
  );
}
