import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, cn } from "@lens/ui";
import { RANKS } from "@/lib/achievements";
import { RankBadge } from "@/components/achievements/RankBadge";
import type { RankId } from "@/types";

// Explains the photographer rank ladder (feedback R1: người dùng chưa hiểu ý
// nghĩa Thợ Bạc / Thợ Kim Cương...). Trigger is a small "info" button placed
// next to a RankBadge; the popover lists every tier + its perks.
export function RankLadderInfo({ currentRank }: { currentRank?: RankId }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Giải thích cấp bậc nhiếp ảnh gia"
          className="focus-ring inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-sm font-semibold">Cấp bậc nhiếp ảnh gia</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cấp bậc tăng theo số buổi chụp hoàn thành. Cấp càng cao, phí hoa hồng
          càng thấp và hồ sơ càng được ưu tiên hiển thị.
        </p>
        <ul className="mt-3 space-y-2">
          {RANKS.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5",
                r.id === currentRank && "bg-muted"
              )}
            >
              <RankBadge rank={r.id} />
              <span className="text-right text-xs text-muted-foreground">
                {r.minSessions === 0 ? "Khởi đầu" : `Từ ${r.minSessions} buổi`}
                {" · "}
                <span className="text-foreground">
                  hoa hồng {Math.round(r.commissionRate * 100)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
