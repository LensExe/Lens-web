import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@lens/ui";

const pad = (n: number) => String(n).padStart(2, "0");

/** "Giữ lịch trong 29:41" — ticks down to the booking's deposit deadline. */
export function HoldCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, new Date(deadline).getTime() - now);
  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  const urgent = left < 5 * 60_000;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
        urgent
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200"
      )}
    >
      <Timer className="size-4 shrink-0" />
      {left > 0 ? (
        <span>
          Khung giờ này được giữ riêng cho bạn trong{" "}
          <span className="font-semibold tabular-nums">
            {pad(minutes)}:{pad(seconds)}
          </span>
          . Đặt cọc trước khi hết giờ — quá hạn, lịch sẽ tự huỷ và khung giờ mở lại cho người khác.
        </span>
      ) : (
        <span>Đã hết thời gian giữ khung giờ. Vui lòng đặt lại.</span>
      )}
    </div>
  );
}
