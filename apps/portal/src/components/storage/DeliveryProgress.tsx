import { CircleCheck, Images } from "lucide-react";
import { Progress, TONE_CHIP, TONE_FILL, cn } from "@lens/ui";

/**
 * "Đã giao 8/15 ảnh" — how far the delivery is from the package's promised
 * photo count. Amber while short, emerald once complete.
 */
export function DeliveryProgress({
  delivered,
  required,
  canUpload,
}: {
  delivered: number;
  required: number;
  canUpload: boolean;
}) {
  const missing = Math.max(0, required - delivered);
  const complete = missing === 0;
  const tone = complete ? "emerald" : "amber";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_CHIP[tone])}>
          {complete ? <CircleCheck className="size-4" /> : <Images className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Đã giao{" "}
            <span className="tabular-nums">
              {Math.min(delivered, required)}/{required}
            </span>{" "}
            ảnh theo gói
            {delivered > required && (
              <span className="font-normal text-muted-foreground"> (+{delivered - required} ảnh tặng thêm)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {complete
              ? canUpload
                ? "Đã đủ số ảnh cam kết — khách có thể xác nhận hoàn thành."
                : "Nhiếp ảnh gia đã giao đủ số ảnh theo gói."
              : canUpload
                ? `Cần giao thêm ${missing} ảnh để khách xác nhận hoàn thành.`
                : `Nhiếp ảnh gia còn thiếu ${missing} ảnh so với gói đã đặt.`}
          </p>
        </div>
      </div>
      <Progress
        value={Math.min(100, (delivered / required) * 100)}
        aria-label={`Đã giao ${delivered}/${required} ảnh`}
        className="mt-3 h-2"
        indicatorClassName={TONE_FILL[tone]}
      />
    </div>
  );
}
