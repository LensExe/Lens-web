import { Check, XCircle } from "lucide-react";
import { cn } from "@lens/ui";
import type { BookingStatus } from "@/types";

// The escrow lifecycle as an ordered stepper. Each step is the status a booking
// sits in while that step is in progress. "cancelled" is off-path → shown as a
// distinct banner instead of a step.
const STEPS: { status: Exclude<BookingStatus, "cancelled">; title: string; desc: string }[] = [
  { status: "awaiting_deposit", title: "Đặt cọc", desc: "Cọc để giữ lịch chụp" },
  { status: "pending", title: "Nhiếp ảnh gia xác nhận", desc: "Đã cọc, chờ nhiếp ảnh gia duyệt" },
  { status: "confirmed", title: "Thanh toán phần còn lại", desc: "Hoàn tất trước buổi chụp" },
  { status: "held", title: "Chụp & giao ảnh", desc: "Sàn giữ tiền đến khi bạn nhận ảnh" },
  { status: "released", title: "Hoàn thành", desc: "Đã giao ảnh & giải ngân" },
];
const ORDER = STEPS.map((s) => s.status);

export function BookingTimeline({ status }: { status: BookingStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Buổi chụp đã huỷ</p>
          <p className="mt-0.5 text-destructive/80">
            Tiền đã trả được hoàn vào ví theo chính sách huỷ (huỷ muộn có thể mất
            tiền cọc). Xem chi tiết trong Ví của bạn.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER.indexOf(status);
  // "released" is the end state — show it as done, not in progress.
  const doneThrough = status === "released" ? currentIndex + 1 : currentIndex;

  return (
    <ol>
      {STEPS.map((step, i) => {
        const done = i < doneThrough;
        const active = i === currentIndex && !done;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  done ? "bg-foreground/75" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                done
                  ? "border-foreground bg-foreground text-background"
                  : active
                    ? "border-ember bg-ember text-white ring-4 ring-ember/15"
                    : "border-border bg-background text-muted-foreground"
              )}
            >
              {done || active ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className={cn("pt-0.5", !done && !active && "opacity-50")}>
              <p className="text-[11px] font-semibold">{step.title}</p>
              <p className="text-[10px] leading-4 text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
