import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Clock3,
  FolderOpen,
  HardDrive,
  Images,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  PageContainer,
  PageHeader,
  Progress,
  Skeleton,
  TONE_FILL,
  cn,
  toast,
  type Tone,
} from "@lens/ui";
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

type GalleryFilter = "all" | "open" | "attention";

function retentionLabel(days: number | null) {
  if (days == null) return "Dài hạn khi còn duy trì gói";
  if (days >= 365) return `Lưu ${Math.round(days / 365)} năm`;
  return `Lưu ${days} ngày`;
}

const usageTone = (pct: number): Tone =>
  pct >= 90 ? "rose" : pct >= 70 ? "amber" : "neutral";

function formatDeliveredAt(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function GalleryRow({ gallery }: { gallery: ShootGallery }) {
  const level = expiryLevel(gallery.expiresAt);
  const days = gallery.expiresAt ? daysUntil(gallery.expiresAt) : 0;
  const needsAttention = gallery.locked || ["warn", "critical", "expired"].includes(level);

  return (
    <Link
      to={`/dashboard/bookings/${gallery.bookingId}/gallery`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-orange-200 hover:bg-orange-50/30 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          needsAttention
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            : "bg-muted text-muted-foreground"
        )}
      >
        {gallery.locked ? <LockKeyhole className="size-5" /> : <Images className="size-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">
            {gallery.style} <span className="font-normal text-muted-foreground">·</span>{" "}
            {gallery.clientName}
          </p>
          {gallery.locked && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Đã khóa
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Giao ngày {formatDeliveredAt(gallery.deliveredAt)}
          <span className="mx-2 text-border">•</span>
          {gallery.photos.length} ảnh
          <span className="mx-2 text-border">•</span>
          {formatBytes(gallery.sizeBytes)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-xs sm:min-w-36 sm:justify-end sm:border-0 sm:pt-0 sm:text-right">
        <div>
          <p
            className={cn(
              "flex items-center gap-1.5 font-medium sm:justify-end",
              needsAttention ? "text-amber-700 dark:text-amber-300" : "text-foreground"
            )}
          >
            {gallery.locked ? (
              <>
                <LockKeyhole className="size-3.5" /> Không thể truy cập
              </>
            ) : level === "none" ? (
              <>
                <ShieldCheck className="size-3.5 text-emerald-600" /> Dài hạn theo gói
              </>
            ) : level === "expired" ? (
              <>
                <Clock3 className="size-3.5" /> Đã hết hạn
              </>
            ) : (
              <>
                <Clock3 className="size-3.5" /> Còn {days} ngày
              </>
            )}
          </p>
          <p className="mt-1 text-muted-foreground">Thời hạn lưu trữ</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-orange-600" />
      </div>
    </Link>
  );
}

export function DashboardStorage() {
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const summary = useStorageSummary();
  const galleries = useMyGalleries();
  const setPlan = useSetStoragePlan();
  const s = summary.data;
  const allGalleries = galleries.data ?? [];

  const visibleGalleries = useMemo(() => {
    if (filter === "open") return allGalleries.filter((gallery) => !gallery.locked);
    if (filter === "attention") {
      return allGalleries.filter((gallery) => {
        const level = expiryLevel(gallery.expiresAt);
        return gallery.locked || ["warn", "critical", "expired"].includes(level);
      });
    }
    return allGalleries;
  }, [allGalleries, filter]);

  const attentionCount = allGalleries.filter((gallery) => {
    const level = expiryLevel(gallery.expiresAt);
    return gallery.locked || ["warn", "critical", "expired"].includes(level);
  }).length;

  const choose = (tier: StoragePlanTier) => {
    if (tier === s?.plan) return;
    setPlan.mutate(tier, {
      onSuccess: () => toast.success(`Đã chuyển sang gói ${planById(tier).name}`),
      onError: () => toast.error("Không thể đổi gói, vui lòng thử lại"),
    });
  };

  // The API exposes a per-gallery quota, so total capacity follows the number
  // of delivered galleries (with one quota shown before the first delivery).
  const capacity = s ? s.quotaBytesPerShoot * Math.max(s.galleryCount, 1) : 0;
  const usedPct = s && capacity > 0 ? Math.min(100, (s.usedBytes / capacity) * 100) : 0;
  const tone = usageTone(usedPct);

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
              <Images className="size-5" />
            </span>
            <span>Lưu trữ ảnh &amp; Kho tài nguyên</span>
            {s && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
                Gói hiện tại · {planById(s.plan).name}
              </span>
            )}
          </span>
        }
        description="Quản lý dung lượng, bộ sưu tập đã giao và thời hạn lưu trữ ảnh của bạn."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/dashboard/bookings">
                <FolderOpen className="size-4" />
                Quản lý buổi chụp
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <a href="#storage-plans">
                <HardDrive className="size-4" />
                Nâng cấp dung lượng
              </a>
            </Button>
          </>
        }
      />

      <section aria-label="Tổng quan lưu trữ" className="grid gap-4 lg:grid-cols-[1.45fr_1fr_1fr]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          {summary.isLoading || !s ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
                    <HardDrive className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Dung lượng sử dụng</p>
                    <p className="text-xs text-muted-foreground">Theo hạn mức mỗi buổi chụp</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {Math.round(usedPct)}% đã dùng
                </span>
              </div>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {formatBytes(s.usedBytes)}
                </span>
                <span className="text-sm text-muted-foreground">/ {formatBytes(capacity)}</span>
              </p>
              <Progress
                value={usedPct}
                className="mt-4 h-2.5 bg-muted"
                indicatorClassName={TONE_FILL[tone]}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{formatBytes(s.quotaBytesPerShoot)} dung lượng cho mỗi bộ sưu tập</span>
                <span>{s.galleryCount} buổi đã giao ảnh</span>
              </div>
              {tone !== "neutral" && (
                <p
                  className={cn(
                    "mt-3 rounded-xl px-3 py-2 text-xs font-medium",
                    tone === "rose"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                  )}
                >
                  {tone === "rose"
                    ? "Dung lượng gần đạt giới hạn. Hãy xem lại gói lưu trữ của bạn."
                    : "Bạn đã sử dụng phần lớn dung lượng hiện có."}
                </p>
              )}
            </>
          )}
        </article>

        <article className="flex min-h-40 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Bộ sưu tập đã giao</p>
              <p className="mt-1 text-xs text-muted-foreground">Album ảnh từ các buổi chụp</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <FolderOpen className="size-5" />
            </span>
          </div>
          {summary.isLoading || !s ? (
            <Skeleton className="mt-5 h-9 w-24" />
          ) : (
            <div className="mt-5">
              <p className="text-3xl font-bold tracking-tight">{s.galleryCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">buổi chụp có ảnh</p>
            </div>
          )}
        </article>

        <article className="flex min-h-40 flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Thời hạn lưu trữ</p>
              <p className="mt-1 text-xs text-muted-foreground">Thời hạn ảnh theo gói hiện tại</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          {summary.isLoading || !s ? (
            <Skeleton className="mt-5 h-9 w-32" />
          ) : (
            <div className="mt-5">
              <p className="text-2xl font-bold tracking-tight">{retentionLabel(s.retentionDays)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Áp dụng cho ảnh đã giao trong các bộ sưu tập.
              </p>
            </div>
          )}
        </article>
      </section>

      <section id="storage-plans" className="mt-8 scroll-mt-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Gói lưu trữ chuyên nghiệp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hạn mức và thời gian lưu ảnh tương ứng với từng gói.
            </p>
          </div>
          {s && (
            <p className="text-xs text-muted-foreground">
              Gói hiện tại: <span className="font-semibold text-foreground">{planById(s.plan).name}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STORAGE_PLANS.map((plan) => {
            const current = s?.plan === plan.id;
            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition",
                  current
                    ? "border-orange-300 ring-1 ring-orange-200 dark:border-orange-900 dark:ring-orange-950"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                {current && <span className="absolute inset-x-0 top-0 h-1 bg-orange-500" />}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <p className="text-base font-semibold">{plan.name}</p>
                    <p className="mt-1 text-xl font-bold tracking-tight">{plan.priceLabel}</p>
                  </div>
                  {current ? (
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                      Đang dùng
                    </span>
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <HardDrive className="size-4" />
                    </span>
                  )}
                </div>
                <p className="mt-3 min-h-10 text-sm text-muted-foreground">{plan.highlight}</p>
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <p className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-emerald-600" />
                    {plan.quotaPerShootGB} GB cho mỗi buổi chụp
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="size-4 shrink-0" />
                    {retentionLabel(plan.retentionDays)}
                  </p>
                </div>
                <Button
                  variant={current ? "outline" : "default"}
                  className={cn("mt-5 w-full rounded-xl", current && "border-orange-200")}
                  disabled={current || setPlan.isPending || summary.isLoading}
                  onClick={() => choose(plan.id)}
                >
                  {setPlan.isPending && setPlan.variables === plan.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : current ? (
                    <Check className="size-4" />
                  ) : null}
                  {current ? "Gói đang sử dụng" : "Chọn gói này"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Bộ sưu tập đã giao</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi dung lượng, quyền truy cập và thời hạn lưu từng album.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/70 p-1" role="tablist" aria-label="Lọc bộ sưu tập">
            {([
              { id: "all", label: "Tất cả", count: allGalleries.length },
              { id: "open", label: "Đang mở", count: allGalleries.filter((gallery) => !gallery.locked).length },
              { id: "attention", label: "Cần chú ý", count: attentionCount },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition",
                  filter === item.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label} <span className="ml-1 opacity-70">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {galleries.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : visibleGalleries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Images className="size-5" />
            </span>
            <p className="mt-4 font-semibold">
              {allGalleries.length === 0 ? "Chưa có bộ sưu tập nào" : "Không có bộ sưu tập phù hợp"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {allGalleries.length === 0
                ? "Bộ sưu tập sẽ xuất hiện tại đây sau khi bạn giao ảnh cho khách."
                : "Thử chọn bộ lọc khác để xem các bộ sưu tập đã giao."}
            </p>
            {allGalleries.length === 0 && (
              <Button asChild variant="outline" className="mt-5 rounded-xl">
                <Link to="/dashboard/bookings">Đi tới Quản lý đặt lịch</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleGalleries.map((gallery) => (
              <GalleryRow key={gallery.bookingId} gallery={gallery} />
            ))}
          </div>
        )}
      </section>

      <aside className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-card p-5 dark:border-emerald-900/60 dark:from-emerald-950/20 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Chủ động theo dõi bộ sưu tập</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thời hạn lưu ảnh phụ thuộc vào gói đang dùng. Album gần hết hạn hoặc bị khóa sẽ được đánh dấu trong danh sách để bạn tiện kiểm tra.
          </p>
        </div>
        <a
          href="#storage-plans"
          className="shrink-0 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
        >
          Xem các gói lưu trữ
        </a>
      </aside>
    </PageContainer>
  );
}
