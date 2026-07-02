import { AlertTriangle, ArrowUpCircle } from "lucide-react";
import { Button, cn } from "@lens/ui";
import { daysUntil, expiryLevel } from "@/lib/storage";
import type { ShootGallery } from "@/types";

/** 7/3/1-day (and expired) warning banner for a delivery gallery. */
export function ExpiryBanner({
  gallery,
  onUpgrade,
}: {
  gallery: ShootGallery;
  /** Photographer-only: show an upgrade CTA. */
  onUpgrade?: () => void;
}) {
  const level = expiryLevel(gallery.expiresAt);
  if (level === "none" || level === "safe") return null;

  const days = gallery.expiresAt ? daysUntil(gallery.expiresAt) : 0;
  const critical = level === "critical" || level === "expired";
  const message =
    level === "expired"
      ? "Ảnh đã hết hạn lưu trữ."
      : `Ảnh sẽ bị xoá sau ${days} ngày.`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between",
        critical
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
      )}
    >
      <span className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          {message} Hãy tải ảnh về ngay
          {onUpgrade ? " hoặc nâng cấp gói để giữ lại." : "."}
        </span>
      </span>
      {onUpgrade && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full"
          onClick={onUpgrade}
        >
          <ArrowUpCircle className="size-4" />
          Nâng cấp gói
        </Button>
      )}
    </div>
  );
}
