import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Search,
  WalletCards,
} from "lucide-react";
import { Button, Input, PageContainer, Skeleton, cn } from "@lens/ui";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import type { BookingStatus } from "@/types";

type FilterValue = "all" | BookingStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "awaiting_deposit", label: "Chờ đặt cọc" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Chờ thanh toán" },
  { value: "held", label: "Sàn đang giữ tiền" },
  { value: "released", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
];

const FILTER_TONE: Record<FilterValue, string> = {
  all: "bg-foreground text-background",
  awaiting_deposit: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  confirmed: "bg-ember/10 text-ember",
  held: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  released: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
};

const SUMMARY_TONE = {
  neutral: "bg-muted text-foreground",
  ember: "bg-ember/10 text-ember",
  lagoon: "bg-lagoon/10 text-lagoon",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
} as const;

function SummaryCard({
  icon: Icon,
  value,
  label,
  hint,
  tone = "neutral",
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  hint: string;
  tone?: keyof typeof SUMMARY_TONE;
}) {
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", SUMMARY_TONE[tone])}>
          <Icon className="size-[18px]" />
        </span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</span>
      </div>
      <p className="mt-4 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </article>
  );
}

function FilterChip({
  value,
  label,
  count,
  active,
  onClick,
}: {
  value: FilterValue;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-all",
        active
          ? value === "all"
            ? "bg-foreground text-background shadow-sm"
            : FILTER_TONE[value] + " ring-1 ring-current/20 shadow-sm"
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "min-w-3.5 text-center tabular-nums",
            active && value === "all" ? "text-background/70" : "text-current/70",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function ClientBookings() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");

  const countOf = (value: FilterValue) =>
    value === "all" ? bookings.length : bookings.filter((booking) => booking.status === value).length;
  const actionRequired = bookings.filter(
    (booking) => booking.status === "awaiting_deposit" || booking.status === "confirmed",
  ).length;
  const completed = countOf("released");
  const pending = countOf("pending");
  const queryValue = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const byStatus = filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter);
    if (!queryValue) return byStatus;
    return byStatus.filter((booking) =>
      [booking.photographerName, booking.style, booking.location, booking.note ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(queryValue),
    );
  }, [bookings, filter, queryValue]);

  return (
    <PageContainer className="max-w-[1320px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <CalendarCheck2 className="size-[18px]" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lịch đặt của tôi</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi tiến độ, thanh toán và những buổi chụp sắp tới của bạn.
          </p>
        </div>
        <Button asChild className="w-fit rounded-full bg-ember text-white shadow-sm hover:bg-ember/90">
          <Link to="/">
            <Search className="size-3.5" />
            Đặt lịch mới
          </Link>
        </Button>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-[142px] rounded-2xl" />)
        ) : (
          <>
            <SummaryCard
              icon={CalendarCheck2}
              value={bookings.length}
              label="Tổng lịch đặt"
              hint="Tất cả buổi chụp của bạn"
            />
            <SummaryCard
              icon={CalendarClock}
              value={pending}
              label="Chờ xác nhận"
              hint={pending ? "Nhiếp ảnh gia sẽ phản hồi sớm" : "Không có yêu cầu đang chờ"}
              tone="lagoon"
            />
            <SummaryCard
              icon={WalletCards}
              value={actionRequired}
              label="Cần bạn xử lý"
              hint={actionRequired ? "Đặt cọc hoặc thanh toán còn lại" : "Bạn không có khoản cần xử lý"}
              tone="ember"
            />
            <SummaryCard
              icon={CheckCircle2}
              value={completed}
              label="Đã hoàn thành"
              hint="Xem lại bộ ảnh và đánh giá"
              tone="success"
            />
          </>
        )}
      </section>

      {actionRequired > 0 && !isLoading && (
        <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-ember/20 bg-ember/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <BellRing className="size-[18px]" />
            </span>
            <div>
              <p className="text-sm font-semibold">Bạn có {actionRequired} lịch cần xử lý</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Hoàn tất thanh toán để giữ khung giờ và chuẩn bị cho buổi chụp.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-ember px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-ember/90 sm:self-auto"
            onClick={() => setFilter("all")}
          >
            Xem lịch cần xử lý
            <ArrowRight className="size-3.5" />
          </button>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Danh sách buổi chụp</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Xem chi tiết lịch, địa điểm và trạng thái thanh toán của từng buổi.
            </p>
          </div>
          <label className="relative block w-full lg:w-64">
            <span className="sr-only">Tìm trong lịch đặt</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm nhiếp ảnh gia, địa điểm..."
              className="h-9 rounded-full pl-9 text-xs"
            />
          </label>
        </div>

        <div
          role="tablist"
          aria-label="Lọc lịch đặt"
          className="mt-4 flex max-w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map(({ value, label }) => (
            <FilterChip
              key={value}
              value={value}
              label={label}
              count={isLoading ? undefined : countOf(value)}
              active={filter === value}
              onClick={() => setFilter(value)}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-[12rem] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/15 px-6 py-14 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CalendarX className="size-5" />
            </span>
            <p className="text-sm font-semibold">
              {queryValue ? "Không tìm thấy lịch phù hợp" : filter === "all" ? "Bạn chưa có lịch đặt nào" : "Không có buổi chụp phù hợp"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {queryValue
                ? "Thử tìm bằng tên nhiếp ảnh gia, phong cách hoặc địa điểm khác."
                : filter === "all"
                  ? "Tìm nhiếp ảnh gia phù hợp và đặt lịch cho khoảnh khắc của bạn."
                  : "Chưa có buổi chụp nào ở trạng thái này."}
            </p>
            {filter === "all" && !queryValue && (
              <Button asChild size="sm" className="mt-4 rounded-full bg-ember text-white hover:bg-ember/90">
                <Link to="/">
                  <Search className="size-3.5" />
                  Tìm nhiếp ảnh gia
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
