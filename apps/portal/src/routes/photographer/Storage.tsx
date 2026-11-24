import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  CloudUpload,
  Database,
  Images,
  Link2,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button, PageContainer, Skeleton, cn } from "@lens/ui";
import { useMyGalleries } from "@/queries/useStorage";
import { useMySubscription } from "@/queries/useSubscriptions";
import { formatBytes } from "@/lib/storage";
import type {
  ApiSubscriptionPlanSnapshot,
  SubscriptionPlanFeatureValue,
} from "@/types/subscriptions";
import type { ShootGallery } from "@/types";

type GalleryFilter = "all" | "published" | "draft";
const EMPTY_GALLERIES: ShootGallery[] = [];

function dateLabel(value: string | null | undefined) {
  if (!value) return "Chưa giao cho khách";
  return `Đã giao ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value))}`;
}

function GalleryRow({ gallery }: { gallery: ShootGallery }) {
  return (
    <Link
      to={`/dashboard/bookings/${gallery.bookingId}/gallery`}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-ember/35 hover:bg-ember/[0.02] sm:gap-4 sm:p-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember sm:size-11">
        <Images className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 truncate text-sm font-semibold">
          <span className="truncate">
            {gallery.style || "Buổi chụp"} · {gallery.clientName}
          </span>
          {gallery.publishedAt && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3" /> Đang mở link
            </span>
          )}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {gallery.photos.length} ảnh · {formatBytes(gallery.sizeBytes)} ·{" "}
          {dateLabel(gallery.publishedAt)}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg"
          aria-label="Mở gallery"
        >
          <span>
            <ArrowUpRight className="size-4" />
          </span>
        </Button>
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted/80">
          <Link2 className="size-3.5" />
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted/80">
          <QrCode className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function featureLabel(feature: SubscriptionPlanFeatureValue) {
  if (typeof feature === "string") return feature;
  return feature.value ? `${feature.name}: ${feature.value}` : feature.name;
}

function planFeatureText(plan: ApiSubscriptionPlanSnapshot | undefined) {
  if (!plan) return "";
  const features = Array.isArray(plan.features) ? plan.features : [];
  return [plan.description ?? "", ...features.map(featureLabel)].join(" ");
}

function planMetric(plan: ApiSubscriptionPlanSnapshot | undefined, unit: "GB" | "ngày") {
  const match = planFeatureText(plan).match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unit}`, "i"));
  return match ? `${match[1]} ${unit}` : "Theo gói";
}

function StorageOverview({ galleries }: { galleries: ShootGallery[] }) {
  const subscriptionQuery = useMySubscription();
  const subscription = subscriptionQuery.data?.subscription;
  const activePlan =
    subscription?.status === "active" ? (subscription.plan_snapshot ?? undefined) : undefined;
  const published = galleries.filter((gallery) => Boolean(gallery.publishedAt));
  const drafts = galleries.length - published.length;
  const sizeBytes = galleries.reduce((total, gallery) => total + gallery.sizeBytes, 0);
  const quotaText = planMetric(activePlan, "GB");
  const usedPercent = (() => {
    const match = quotaText.match(/([\d.,]+)\s*GB/i);
    const quota = match ? Number(match[1].replace(",", ".")) : 0;
    return quota > 0 ? Math.min(100, Math.round((sizeBytes / (quota * 1024 ** 3)) * 100)) : 0;
  })();

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Lưu trữ ảnh &amp; Kho tài nguyên
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {activePlan
                ? `${activePlan.name} · Đang hoạt động`
                : subscription?.status === "pending"
                  ? "Chờ thanh toán"
                  : "Chưa chọn gói"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Quản lý dung lượng lưu trữ đám mây tốc độ cao, sao lưu an toàn ảnh gốc RAW/JPEG và tự
            động phân phối link bảo mật cho khách hàng.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/dashboard/bookings">
              <CloudUpload className="size-4" /> Tải lên tệp mới
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-ember text-white hover:bg-ember/90">
            <Link to="/dashboard/subscription">
              <Sparkles className="size-4" /> Quản lý gói
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.7fr_0.9fr_0.9fr]">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Database className="size-3.5 text-ember" /> Dung lượng sử dụng
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatBytes(sizeBytes)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {quotaText}
                </span>
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {activePlan ? "Theo gói hiện tại" : "Chưa kích hoạt"}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-ember"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-muted-foreground">
            <span>
              <b className="text-foreground">RAW/JPEG:</b> {formatBytes(sizeBytes)}
            </span>
            <span>
              <b className="text-foreground">Đã giao:</b> {published.length} album
            </span>
            <span>
              <b className="text-foreground">Nháp:</b> {drafts} album
            </span>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Bộ sưu tập đã giao <Images className="size-4 text-muted-foreground" />
          </p>
          <p className="mt-4 text-2xl font-bold tracking-tight">
            {published.length} <span className="text-base font-medium">Album</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {published.length ? "Đã chia sẻ trực tuyến" : "Chưa có album đã giao"}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Bảo vệ &amp; sao lưu <ShieldCheck className="size-4 text-muted-foreground" />
          </p>
          <p className="mt-4 text-2xl font-bold tracking-tight">{planMetric(activePlan, "ngày")}</p>
          <p className="mt-1 text-xs text-muted-foreground">Mã hóa CDN &amp; Watermark AI</p>
        </article>
      </div>
    </section>
  );
}

export function PhotographerStorage() {
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const query = useMyGalleries();
  const galleries = query.data ?? EMPTY_GALLERIES;
  const visible = useMemo(
    () =>
      galleries.filter(
        (gallery) =>
          filter === "all" ||
          (filter === "published" ? Boolean(gallery.publishedAt) : !gallery.publishedAt),
      ),
    [filter, galleries],
  );

  return (
    <PageContainer className="max-w-[1200px] py-6 md:py-8">
      <StorageOverview galleries={galleries} />

      <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Bộ sưu tập đã giao</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Theo dõi hoạt động và quản lý quyền truy cập của khách hàng.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {(
                [
                  ["all", `Tất cả (${galleries.length})`],
                  [
                    "published",
                    `Đang mở (${galleries.filter((gallery) => gallery.publishedAt).length})`,
                  ],
                  [
                    "draft",
                    `Sắp hết hạn (${galleries.filter((gallery) => !gallery.publishedAt).length})`,
                  ],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[10px] font-medium",
                    filter === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-ember text-xs text-white hover:bg-ember/90"
            >
              <Link to="/dashboard/bookings">
                <UploadCloud className="size-3.5" /> Tạo Album mới
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {query.isLoading ? (
            [0, 1, 2].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)
          ) : query.isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
              Không thể tải gallery. Hãy thử tải lại trang.
            </div>
          ) : visible.length ? (
            visible.map((gallery) => <GalleryRow key={gallery.bookingId} gallery={gallery} />)
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
              <Search className="size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Chưa có gallery phù hợp</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Gallery sẽ xuất hiện sau khi bạn tải ảnh lên lịch chụp.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Đồng bộ hóa tự động &amp; Bảo vệ bản quyền</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Hệ thống Lens tự động Watermark chống sao chép trong màn hình khi khách hàng chưa giải
              ngân nghiệm thu. Đồng thời phân phối qua mạng lưới CDN đa điểm giúp khách tải ảnh an
              toàn.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/settings/account"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ember hover:underline"
        >
          Tìm hiểu chính sách lưu trữ &amp; an toàn dữ liệu <ArrowUpRight className="size-3.5" />
        </Link>
      </section>
    </PageContainer>
  );
}
