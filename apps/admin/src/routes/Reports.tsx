import { useState } from "react";
import { CalendarCheck, MapPin, Palette, TrendingUp, Wallet } from "lucide-react";
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
import { formatCount } from "@/lib/format";

type Metric = "revenue" | "bookings";

const change = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : undefined;

export function Reports() {
  const { data, isLoading } = useReports();
  const [metric, setMetric] = useState<Metric>("revenue");

  if (isLoading || !data) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-56" />
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72 rounded-2xl" />
      </PageContainer>
    );
  }

  const months = data.monthly;
  const cur = months[months.length - 1];
  const prev = months[months.length - 2];
  const avg = (m: { revenue: number; bookings: number }) => (m.bookings ? Math.round(m.revenue / m.bookings) : 0);

  return (
    <PageContainer>
      <PageHeader title="Báo cáo & thống kê" description={`Hiệu suất nền tảng 6 tháng gần nhất (${months[0].month}–${cur.month}).`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          value={formatCount(cur.bookings)}
          label="Lượt đặt tháng này"
          delta={change(cur.bookings, prev.bookings)}
        />
        <StatCard
          icon={Wallet}
          value={formatPrice(cur.revenue)}
          label="Doanh thu tháng này"
          delta={change(cur.revenue, prev.revenue)}
        />
        <StatCard
          icon={TrendingUp}
          value={formatPrice(avg(cur))}
          label="Trung bình mỗi buổi"
          delta={change(avg(cur), avg(prev))}
        />
      </div>

      {/* Trend: one measure at a time (never two scales on one chart) */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{metric === "revenue" ? "Doanh thu theo tháng" : "Lượt đặt theo tháng"}</h2>
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
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Palette className="size-4 text-muted-foreground" />
            Lượt đặt theo phong cách
          </h2>
          <BarList
            items={data.byStyle.map((s) => ({ label: s.label, value: s.count }))}
            format={formatCount}
          />
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <MapPin className="size-4 text-muted-foreground" />
            Lượt đặt theo khu vực
          </h2>
          <BarList
            items={data.byCity.map((c) => ({ label: c.label, value: c.count }))}
            format={formatCount}
          />
        </section>
      </div>
    </PageContainer>
  );
}
