import { CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import { Skeleton, formatPrice } from "@lens/ui";
import { StatCard } from "@/components/StatCard";
import { useReports } from "@/queries/useReports";
import { formatCount } from "@/lib/format";
import type { Breakdown } from "@/types";

function BreakdownList({ title, items }: { title: string; items: Breakdown[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{formatCount(item.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Reports() {
  const { data, isLoading } = useReports();

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
        <Skeleton className="h-9 w-56" />
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-72 rounded-2xl" />
      </div>
    );
  }

  const totalBookings = data.monthly.reduce((s, m) => s + m.bookings, 0);
  const totalRevenue = data.monthly.reduce((s, m) => s + m.revenue, 0);
  const avgPerBooking = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;
  const maxRevenue = Math.max(...data.monthly.map((m) => m.revenue), 1);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Báo cáo &amp; thống kê
        </h1>
        <p className="mt-1 text-muted-foreground">
          Hiệu suất nền tảng trong 6 tháng gần nhất.
        </p>
      </header>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} value={formatCount(totalBookings)} label="Lượt đặt lịch" />
        <StatCard icon={Wallet} value={formatPrice(totalRevenue)} label="Tổng doanh thu" />
        <StatCard icon={TrendingUp} value={formatPrice(avgPerBooking)} label="Trung bình / buổi" />
      </div>

      {/* Monthly revenue bar chart */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="font-semibold">Doanh thu theo tháng</h2>
        <div className="mt-6 flex gap-3 sm:gap-6">
          {data.monthly.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center">
              <span className="mb-2 text-xs font-medium text-muted-foreground">
                {Math.round(m.revenue / 1_000_000)}tr
              </span>
              <div className="flex h-44 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-foreground transition-all"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                  title={formatPrice(m.revenue)}
                />
              </div>
              <span className="mt-2 text-xs text-muted-foreground">{m.month}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Breakdowns */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownList title="Theo phong cách chụp" items={data.byStyle} />
        <BreakdownList title="Theo khu vực" items={data.byCity} />
      </div>
    </div>
  );
}
