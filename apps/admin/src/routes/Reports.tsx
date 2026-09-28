import { useState } from "react";
import { CalendarCheck, MapPin, Palette, Star, TrendingUp, Wallet } from "lucide-react";
import {
  BarChart,
  BarList,
  PageContainer,
  PageHeader,
  Skeleton,
  StatCard,
  cn,
  formatPrice,
  formatPriceCompact,
} from "@lens/ui";
import { useReports } from "@/queries/useReports";
import { UserCell } from "@/components/UserCell";
import { formatCount } from "@/lib/format";

type Metric = "revenue" | "bookings";

const change = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : undefined;

export function Reports() {
  const { data, isLoading } = useReports();
  const [metric, setMetric] = useState<Metric>("revenue");

  if (isLoading || !data) {
    return (
      <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-80 rounded-3xl" />
        <Skeleton className="mt-5 h-72 rounded-3xl" />
      </PageContainer>
    );
  }

  const months = data.monthly;
  const cur = months[months.length - 1];
  const prev = months[months.length - 2];
  const avg = (m: { revenue: number; bookings: number }) => (m.bookings ? Math.round(m.revenue / m.bookings) : 0);
  const topRated = data.topRated ?? [];

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <div className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-muted/55 via-card to-card p-5 shadow-sm sm:p-6">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                <TrendingUp className="size-5" />
              </span>
              <span>Báo cáo &amp; thống kê</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Hiệu suất nền tảng trong 6 tháng gần nhất, cùng bảng xếp hạng những nhiếp ảnh gia được đánh giá cao.
            </span>
          }
          actions={
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              {months[0].month} – {cur.month}
            </span>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          value={formatCount(cur.bookings)}
          label="Lượt đặt tháng này"
          delta={change(cur.bookings, prev.bookings)}
          hint="So với tháng trước"
          className="rounded-3xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={Wallet}
          value={formatPrice(cur.revenue)}
          label="Doanh thu tháng này"
          delta={change(cur.revenue, prev.revenue)}
          hint="Tổng doanh thu ghi nhận"
          className="rounded-3xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={TrendingUp}
          value={formatPrice(avg(cur))}
          label="Trung bình mỗi buổi"
          delta={change(avg(cur), avg(prev))}
          hint="Doanh thu trung bình / booking"
          className="rounded-3xl border-border/70 shadow-sm"
        />
      </div>

      {/* Trend: one measure at a time (never two scales on one chart) */}
      <section className="mt-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{metric === "revenue" ? "Doanh thu theo tháng" : "Lượt đặt theo tháng"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Theo dõi xu hướng để so sánh hiệu suất nền tảng.</p>
          </div>
          <div role="tablist" aria-label="Chỉ số" className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
            {(
              [
                { value: "revenue", label: "Doanh thu" },
                { value: "bookings", label: "Lượt đặt" },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={metric === t.value}
                onClick={() => setMetric(t.value)}
                className={cn(
                  "focus-ring rounded-full px-4 py-1.5 font-medium transition-colors",
                  metric === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <BarChart
          data={months.map((m) => ({ label: m.month, value: metric === "revenue" ? m.revenue : m.bookings }))}
          format={metric === "revenue" ? formatPriceCompact : (v) => formatCount(v)}
          height={220}
          ariaLabel={metric === "revenue" ? "Doanh thu theo tháng" : "Lượt đặt theo tháng"}
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Palette className="size-4 text-muted-foreground" />
            Lượt đặt theo phong cách
          </h2>
          <BarList
            items={data.byStyle.map((s) => ({ label: s.label, value: s.count }))}
            format={formatCount}
          />
        </section>
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <MapPin className="size-4 text-muted-foreground" />
            Lượt đặt theo khu vực
          </h2>
          <BarList
            items={data.byCity.map((c) => ({ label: c.label, value: c.count }))}
            format={formatCount}
          />
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Bảng xếp hạng top rating</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Những nhiếp ảnh gia có điểm đánh giá trung bình cao nhất trên nền tảng.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            <Star className="size-3.5 fill-current" />
            Theo điểm trung bình
          </span>
        </div>

        <div className="mt-5 space-y-2">
          {topRated.map((photographer, index) => (
            <div
              key={photographer.photographerId}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-muted/[0.08] p-3 transition-colors hover:bg-muted/35 sm:gap-4 sm:p-3.5"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                  index === 0
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                    : index === 1
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200"
                      : index === 2
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200"
                        : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <UserCell
                  name={photographer.name}
                  avatar={photographer.avatar}
                  sub={`${photographer.reviewCount} đánh giá · ${photographer.completedSessions} buổi hoàn thành`}
                />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                  <Star className="size-3.5 fill-amber-400 text-amber-500" />
                  {photographer.rating.toFixed(2)}
                </span>
                <span className="text-[11px] text-muted-foreground">Top rating</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
