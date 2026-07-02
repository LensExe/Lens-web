import { Link } from "react-router-dom";
import {
  Check,
  Clock3,
  HardDrive,
  Images,
  Loader2,
  Lock,
} from "lucide-react";
import { Button, Progress, Skeleton, cn, toast } from "@lens/ui";
import {
  STORAGE_PLANS,
  daysUntil,
  expiryLevel,
  formatBytes,
  planById,
} from "@/lib/storage";
import {
  useMyGalleries,
  useSetStoragePlan,
  useStorageSummary,
} from "@/queries/useStorage";
import type { ShootGallery, StoragePlanTier } from "@/types";

function retentionLabel(days: number | null) {
  if (days == null) return "Lưu trữ dài hạn khi còn duy trì gói";
  if (days >= 365) return `Lưu ${Math.round(days / 365)} năm`;
  return `Lưu ${days} ngày`;
}

function GalleryRow({ gallery }: { gallery: ShootGallery }) {
  const level = expiryLevel(gallery.expiresAt);
  const days = gallery.expiresAt ? daysUntil(gallery.expiresAt) : 0;
  return (
    <Link
      to={`/dashboard/bookings/${gallery.bookingId}/gallery`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Images className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {gallery.style} · {gallery.clientName}
        </p>
        <p className="text-sm text-muted-foreground">
          {gallery.photos.length} ảnh · {formatBytes(gallery.sizeBytes)}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs">
        {gallery.locked ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Lock className="size-3.5" /> Đã khoá
          </span>
        ) : level === "none" ? (
          <span className="text-muted-foreground">Dài hạn</span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1",
              level === "warn" || level === "critical" || level === "expired"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            )}
          >
            <Clock3 className="size-3.5" />
            {level === "expired" ? "Hết hạn" : `Còn ${days} ngày`}
          </span>
        )}
      </div>
    </Link>
  );
}

export function DashboardStorage() {
  const summary = useStorageSummary();
  const galleries = useMyGalleries();
  const setPlan = useSetStoragePlan();

  const choose = (tier: StoragePlanTier) => {
    if (tier === summary.data?.plan) return;
    setPlan.mutate(tier, {
      onSuccess: () =>
        toast.success(`Đã chuyển sang gói ${planById(tier).name}`),
      onError: () => toast.error("Không thể đổi gói, vui lòng thử lại"),
    });
  };

  const s = summary.data;
  // Soft capacity for the usage bar: per-shoot quota × delivered galleries.
  const capacity = s ? s.quotaBytesPerShoot * Math.max(s.galleryCount, 1) : 0;
  const usedPct = s && capacity > 0 ? Math.min(100, (s.usedBytes / capacity) * 100) : 0;

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Lưu trữ ảnh
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý dung lượng và gói lưu trữ ảnh cho các buổi chụp.
        </p>
      </header>

      {/* Usage overview */}
      <section className="mt-7 rounded-3xl border border-border bg-card p-6">
        {summary.isLoading || !s ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="size-4" />
                Đã dùng
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                Gói {planById(s.plan).name}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {formatBytes(s.usedBytes)}
            </p>
            <Progress value={usedPct} className="mt-3" />
            <p className="mt-2 text-sm text-muted-foreground">
              {s.galleryCount} buổi · {formatBytes(s.quotaBytesPerShoot)} mỗi buổi ·{" "}
              {retentionLabel(s.retentionDays)}
            </p>
          </>
        )}
      </section>

      {/* Plans */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Gói lưu trữ</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STORAGE_PLANS.map((plan) => {
            const current = s?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border p-5",
                  current ? "border-foreground ring-1 ring-foreground" : "border-border"
                )}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {plan.priceLabel}
                </p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {plan.highlight}
                </p>
                <Button
                  variant={current ? "outline" : "default"}
                  className="mt-4 rounded-full"
                  disabled={current || setPlan.isPending}
                  onClick={() => choose(plan.id)}
                >
                  {setPlan.isPending && setPlan.variables === plan.id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {current && <Check className="size-4" />}
                  {current ? "Đang dùng" : "Chọn gói"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delivered galleries */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Bộ sưu tập đã giao</h2>
        {galleries.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-18 rounded-2xl" />
            <Skeleton className="h-18 rounded-2xl" />
          </div>
        ) : (galleries.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-medium">Chưa có bộ sưu tập nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Giao ảnh cho khách từ trang Quản lý đặt lịch.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(galleries.data ?? []).map((g) => (
              <GalleryRow key={g.bookingId} gallery={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
