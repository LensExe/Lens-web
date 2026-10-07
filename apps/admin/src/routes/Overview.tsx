import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Camera, Flag, Users, Wallet } from "lucide-react";
import { PageContainer, PageHeader, Skeleton, StatCard, formatPrice } from "@lens/ui";
import { NAV_GROUPS } from "@/components/layout/nav";
import { useOverviewStats } from "@/queries/useStats";

const SECTION_HINT: Record<string, string> = {
  "/photographers": "Hồ sơ nhiếp ảnh gia chờ duyệt",
  "/users": "Tài khoản trên nền tảng",
  "/bookings": "Lịch đặt và trạng thái thực tế",
  "/finance": "Yêu cầu rút tiền và hoàn tiền",
  "/storage": "Chưa có API báo cáo dung lượng",
  "/quality": "Cấu hình hạng và huy hiệu",
  "/reports": "Báo cáo moderation",
};

const SECTIONS = NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.to !== "/");

export function Overview() {
  const { data, isLoading, isError } = useOverviewStats();

  return (
    <PageContainer>
      <PageHeader title="Tổng quan" description="Số liệu tổng hợp mới nhất được backend cung cấp." />
      {isError && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Không tải được dashboard từ backend.</p>}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}</div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} value={data.users} label="Tổng người dùng" />
          <StatCard icon={Camera} value={data.photographers} label="Nhiếp ảnh gia" />
          <StatCard icon={CalendarCheck} value={data.bookings} label="Lượt đặt lịch" />
          <StatCard icon={Flag} value={data.open_reports} label="Báo cáo đang mở" />
          <StatCard icon={Wallet} value={formatPrice(data.paid_volume_vnd)} label="Tổng thanh toán đã ghi nhận" />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        Dashboard backend hiện chỉ có số liệu tổng hợp. Chưa có API hàng đợi công việc, xu hướng theo tháng hoặc hoạt động gần đây.
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Lối tắt</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium leading-tight">{label}</p><p className="truncate text-sm text-muted-foreground">{SECTION_HINT[to]}</p></div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
