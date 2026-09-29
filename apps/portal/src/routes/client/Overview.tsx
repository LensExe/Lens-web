import { useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Images,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  SunMedium,
  Wallet,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  PageContainer,
  Skeleton,
  cn,
  formatPrice,
} from "@lens/ui";
import { useConversations } from "@/queries/useMessages";
import { useMyBookings } from "@/queries/useBookings";
import { useMyProfile } from "@/queries/useProfile";
import { addMinutesToTime, todayISO } from "@/lib/schedule";
import { BOOKING_STATUS_META, remainingAmount } from "@/lib/booking";
import { currentUser } from "@/lib/session";
import type { Booking, BookingStatus } from "@/types";

type BookingFilter = "all" | "payment" | "pending" | "completed";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("");

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return day + "/" + month + "/" + year;
};

const formatGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const statusProgress: Record<BookingStatus, number> = {
  awaiting_deposit: 0,
  pending: 1,
  confirmed: 2,
  held: 3,
  released: 4,
  cancelled: 0,
};

const progressSteps = ["Đã đặt cọc", "Xác nhận lịch", "Thanh toán", "Hoàn thành"];

const depositPaidStatuses: BookingStatus[] = ["pending", "confirmed", "held", "released"];

const hasPaidDeposit = (booking: Pick<Booking, "status" | "depositPaidAt">) =>
  Boolean(booking.depositPaidAt) || depositPaidStatuses.includes(booking.status);

function SummaryMetric({
  icon: Icon,
  label,
  value,
  hint,
  to,
  tone = "muted",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  to: string;
  tone?: "muted" | "ember" | "lagoon" | "success";
}) {
  const toneClasses = {
    muted: "bg-muted text-muted-foreground",
    ember: "bg-ember/10 text-ember",
    lagoon: "bg-lagoon/10 text-lagoon",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-9 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="size-4" />
        </span>
        <span className="mt-1 size-2 rounded-full bg-foreground/70" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs font-medium">{label}</p>
      <Link
        to={to}
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {hint}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function BookingProgress({ status }: { status: BookingStatus }) {
  const activeStep = statusProgress[status];

  return (
    <div className="mt-4 border-t border-border/70 pt-3">
      <div className="flex items-start">
        {progressSteps.map((step, index) => {
          const complete = activeStep > index;
          const active = activeStep === index;
          return (
            <div key={step} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                    complete && "border-lagoon bg-lagoon text-white",
                    active && "border-ember bg-ember text-white",
                    !complete && !active && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {complete ? <Check className="size-3" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-center text-[10px]",
                    active || complete ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
              {index < progressSteps.length - 1 && (
                <span
                  className={cn(
                    "mt-2.5 h-px flex-1",
                    activeStep > index ? "bg-lagoon" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingAction({ booking }: { booking: Booking }) {
  if (booking.status === "awaiting_deposit") {
    return (
      <Button
        asChild
        size="lg"
        className="h-10 w-full rounded-xl bg-ember px-4 text-xs font-semibold text-white shadow-sm shadow-ember/20 hover:bg-ember/90 sm:w-auto"
      >
        <Link to={"/client/bookings/" + booking.id + "/deposit"}>
          <Wallet className="size-4" />
          Đặt cọc {formatPrice(booking.depositAmount)}
        </Link>
      </Button>
    );
  }

  if (booking.status === "confirmed") {
    return (
      <Button
        asChild
        size="lg"
        className="h-10 w-full rounded-xl bg-ember px-4 text-xs font-semibold text-white shadow-sm shadow-ember/20 hover:bg-ember/90 sm:w-auto"
      >
        <Link to={"/client/bookings/" + booking.id + "/pay"}>
          <CreditCard className="size-4" />
          Thanh toán {formatPrice(remainingAmount(booking))}
        </Link>
      </Button>
    );
  }

  if (booking.status === "held" || booking.status === "released") {
    return (
      <Button
        asChild
        size="lg"
        variant="outline"
        className="h-10 w-full rounded-xl px-4 text-xs font-semibold sm:w-auto"
      >
        <Link to={"/client/bookings/" + booking.id + "/gallery"}>
          <Images className="size-4" />
          Xem bộ sưu tập
        </Link>
      </Button>
    );
  }

  return null;
}

function BookingPaymentStatus({ booking }: { booking: Booking }) {
  if (!hasPaidDeposit(booking)) return null;

  const waitingForConfirmation = booking.status === "pending";
  const paidInFull = booking.status === "held" || booking.status === "released";
  const title = paidInFull
    ? "Đã thanh toán đủ"
    : "Đã đặt cọc " + formatPrice(booking.depositAmount);
  const detail = waitingForConfirmation
    ? "Yêu cầu đang chờ nhiếp ảnh gia xác nhận."
    : booking.status === "confirmed"
      ? "Thanh toán phần còn lại để khóa lịch chụp."
      : booking.status === "held"
        ? "Lens đang giữ tiền an toàn cho đến khi bạn nhận ảnh."
        : "Buổi chụp đã hoàn tất và giao dịch đã được xử lý.";
  const badge = waitingForConfirmation
    ? "Chờ xác nhận"
    : booking.status === "confirmed"
      ? "Còn lại " + formatPrice(remainingAmount(booking))
      : booking.status === "held"
        ? "Đang bảo vệ"
        : "Hoàn tất";

  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-3 rounded-xl border px-3 py-2.5",
        waitingForConfirmation
          ? "border-lagoon/30 bg-lagoon/[0.07]"
          : "border-emerald-500/25 bg-emerald-500/[0.06] dark:border-emerald-400/25 dark:bg-emerald-400/[0.07]",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          waitingForConfirmation
            ? "bg-lagoon/15 text-lagoon"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        )}
      >
        <ShieldCheck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{detail}</p>
      </div>
      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex",
          waitingForConfirmation
            ? "bg-lagoon/15 text-lagoon"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        )}
      >
        {badge}
      </span>
    </div>
  );
}

function OverviewBookingCard({
  booking,
  featured = false,
}: {
  booking: Booking;
  featured?: boolean;
}) {
  const status = BOOKING_STATUS_META[booking.status];
  const duration = booking.packageSnapshot?.durationHours ?? 2;
  const endTime = booking.timeSlot ? addMinutesToTime(booking.timeSlot, duration * 60) : null;
  const depositPaid = hasPaidDeposit(booking);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        featured && !depositPaid && "border-ember/70 ring-1 ring-ember/15",
        depositPaid && "border-lagoon/40 bg-lagoon/[0.02] ring-1 ring-lagoon/10",
        !featured && !depositPaid && "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-muted text-xs font-semibold">
            {initialsOf(booking.photographerName)}
          </AvatarFallback>
        </Avatar>

        <Link to={"/client/bookings/" + booking.id} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold hover:underline">{booking.photographerName}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{booking.style}</p>
        </Link>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">{formatPrice(booking.price)}</p>
          {booking.status === "released" && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Đã hoàn thành
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatDate(booking.date)}
          {booking.timeSlot ? " • " + booking.timeSlot + (endTime ? "–" + endTime : "") : ""}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{booking.location}</span>
        </span>
      </div>

      <BookingPaymentStatus booking={booking} />

      {booking.status !== "cancelled" && <BookingProgress status={booking.status} />}

      <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[11px] leading-4 text-muted-foreground">
          {booking.status === "awaiting_deposit" && (
            <>
              <Wallet className="size-3.5 shrink-0 text-ember" />
              <span className="text-ember">Thanh toán cọc để giữ lịch</span>
            </>
          )}
          {booking.status === "confirmed" && (
            <>
              <CreditCard className="size-3.5 shrink-0 text-ember" />
              <span className="text-ember">Còn lại {formatPrice(remainingAmount(booking))}</span>
            </>
          )}
          {booking.status === "pending" && (
            <>
              <CalendarClock className="size-3.5 shrink-0 text-lagoon" />
              <span>Đang chờ nhiếp ảnh gia phản hồi</span>
            </>
          )}
          {booking.status === "held" && (
            <>
              <ShieldCheck className="size-3.5 shrink-0 text-lagoon" />
              <span>Tiền đang được Lens bảo vệ</span>
            </>
          )}
          {booking.status === "released" && (
            <>
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              <span>Buổi chụp đã hoàn tất</span>
            </>
          )}
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-10 w-full rounded-xl px-4 text-xs font-semibold sm:w-auto"
          >
            <Link
              to={"/client/bookings/" + booking.id}
              aria-label={"Xem chi tiết lịch chụp với " + booking.photographerName}
            >
              Chi tiết
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
          <BookingAction booking={booking} />
        </div>
      </div>
    </article>
  );
}

function TodoItem({
  icon: Icon,
  title,
  hint,
  to,
  tone = "ember",
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  to: string;
  tone?: "ember" | "lagoon";
}) {
  return (
    <Link
      to={to}
      className="flex min-h-16 items-start gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          tone === "ember" ? "bg-ember/10 text-ember" : "bg-lagoon/10 text-lagoon",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function FilterTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label} <span className={cn("ml-0.5", active ? "text-background/70" : "text-muted-foreground")}>({count})</span>
    </button>
  );
}

export function ClientOverview() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const { data: conversations = [] } = useConversations();
  const { data: profile } = useMyProfile();
  const [filter, setFilter] = useState<BookingFilter>("all");

  const today = todayISO();
  const upcoming = bookings
    .filter(
      (booking) =>
        booking.date >= today &&
        ["awaiting_deposit", "pending", "confirmed", "held"].includes(booking.status),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.timeSlot ?? "").localeCompare(b.timeSlot ?? ""),
    );
  const completed = bookings.filter((booking) => booking.status === "released");
  const needsPayment = bookings.filter(
    (booking) => booking.status === "awaiting_deposit" || booking.status === "confirmed",
  );
  const pending = bookings.filter((booking) => booking.status === "pending");
  const unread = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
  const nearest = upcoming[0];

  const filteredBookings =
    filter === "all"
      ? upcoming
      : filter === "payment"
        ? upcoming.filter(
            (booking) => booking.status === "awaiting_deposit" || booking.status === "confirmed",
          )
        : filter === "pending"
          ? upcoming.filter((booking) => booking.status === "pending")
          : completed;

  const styleTags = [...new Set(bookings.map((booking) => booking.style))].slice(0, 3);
  const firstName = (profile?.name ?? currentUser.name).split(" ")[0];

  return (
    <PageContainer>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {formatGreeting()}, {firstName} <span className="text-ember">✦</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tổng quan lịch chụp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi lịch đặt, thanh toán và những khoảnh khắc sắp tới của bạn.
          </p>
        </div>
        <Button asChild className="w-fit rounded-full bg-ember text-white hover:bg-ember/90">
          <Link to="/">
            <Search className="size-4" />
            Tìm nhiếp ảnh gia
          </Link>
        </Button>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          icon={CalendarCheck}
          label="Tổng buổi chụp"
          value={bookings.length}
          hint="Xem lịch của tôi"
          to="/client/bookings"
        />
        <SummaryMetric
          icon={Wallet}
          label="Cần thanh toán"
          value={needsPayment.length}
          hint={needsPayment.length > 0 ? "Xử lý ngay" : "Bạn đã hoàn tất"}
          to="/client/bookings"
          tone="ember"
        />
        <SummaryMetric
          icon={CalendarClock}
          label="Chờ xác nhận"
          value={pending.length}
          hint={pending.length > 0 ? "Đang chờ phản hồi" : "Không có yêu cầu mới"}
          to="/client/bookings"
          tone="lagoon"
        />
        <SummaryMetric
          icon={CheckCircle2}
          label="Đã hoàn thành"
          value={completed.length}
          hint="Xem bộ sưu tập"
          to="/client/bookings"
          tone="success"
        />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-ember" />
                  <h2 className="text-sm font-semibold">Danh sách buổi chụp sắp tới</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Xem tiến độ thực hiện, hợp đồng và trao đổi với nhiếp ảnh gia.
                </p>
              </div>
              <Link
                to="/client/bookings"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Xem tất cả
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex flex-wrap gap-1 rounded-full bg-muted/60 p-1">
                <FilterTab
                  active={filter === "all"}
                  label="Tất cả"
                  count={upcoming.length}
                  onClick={() => setFilter("all")}
                />
                <FilterTab
                  active={filter === "payment"}
                  label="Cần thanh toán"
                  count={needsPayment.length}
                  onClick={() => setFilter("payment")}
                />
                <FilterTab
                  active={filter === "pending"}
                  label="Chờ xác nhận"
                  count={pending.length}
                  onClick={() => setFilter("pending")}
                />
                <FilterTab
                  active={filter === "completed"}
                  label="Đã hoàn thành"
                  count={completed.length}
                  onClick={() => setFilter("completed")}
                />
              </div>
              <Link
                to="/client/bookings"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted"
              >
                <Search className="size-3" />
                Tìm theo lịch, địa điểm...
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                [0, 1, 2].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CalendarDays className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium">
                    {filter === "completed" ? "Chưa có buổi chụp hoàn thành" : "Chưa có buổi chụp phù hợp"}
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Tìm một nhiếp ảnh gia phù hợp để bắt đầu lưu giữ khoảnh khắc của bạn.
                  </p>
                  <Button asChild size="sm" className="mt-4 rounded-full">
                    <Link to="/">
                      Tìm nhiếp ảnh gia
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                filteredBookings.map((booking, index) => (
                  <OverviewBookingCard key={booking.id} booking={booking} featured={index === 0} />
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-ember" />
                <h2 className="text-sm font-semibold">Việc cần làm</h2>
              </div>
              {needsPayment.length + pending.length + unread > 0 && (
                <span className="rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-medium text-ember">
                  {needsPayment.length + pending.length + unread} việc
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {needsPayment[0] && (
                <TodoItem
                  icon={CreditCard}
                  title={
                    needsPayment[0].status === "awaiting_deposit"
                      ? "Thanh toán tiền cọc"
                      : "Thanh toán phần còn lại"
                  }
                  hint="Hoàn tất để giữ lịch chụp của bạn."
                  to={
                    "/client/bookings/" +
                    needsPayment[0].id +
                    (needsPayment[0].status === "awaiting_deposit" ? "/deposit" : "/pay")
                  }
                />
              )}
              {pending[0] && (
                <TodoItem
                  icon={CalendarClock}
                  title="Chờ nhiếp ảnh gia xác nhận"
                  hint={pending[0].photographerName + " đang xem yêu cầu của bạn."}
                  to={"/client/bookings/" + pending[0].id}
                  tone="lagoon"
                />
              )}
              {unread > 0 && (
                <TodoItem
                  icon={MessageSquare}
                  title="Bạn có tin nhắn mới"
                  hint={unread + " tin nhắn chưa đọc từ nhiếp ảnh gia."}
                  to="/messages"
                  tone="lagoon"
                />
              )}
              {needsPayment.length === 0 && pending.length === 0 && unread === 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-lagoon" />
                  Mọi thứ đang được cập nhật.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SunMedium className="size-4 text-ember" />
                <h2 className="text-sm font-semibold">Ngày chụp gần nhất</h2>
              </div>
              {nearest && <span className="text-[10px] text-muted-foreground">{formatDate(nearest.date)}</span>}
            </div>
            {nearest ? (
              <Link to={"/client/bookings/" + nearest.id} className="mt-3 block rounded-xl bg-muted/60 p-3 hover:bg-muted">
                <p className="text-2xl font-semibold tracking-tight">
                  {nearest.timeSlot ?? "--:--"}
                </p>
                <p className="mt-1 text-xs font-medium">{nearest.style}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" />
                  <span className="truncate">{nearest.location}</span>
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  với {nearest.photographerName}
                </p>
              </Link>
            ) : (
              <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                Bạn chưa có lịch chụp sắp tới.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-ember" />
              <h2 className="text-sm font-semibold">Sẵn sàng cho buổi chụp tiếp theo?</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Khám phá nhiếp ảnh gia theo phong cách bạn yêu thích.
            </p>
            <Link
              to="/"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-85"
            >
              Tìm nhiếp ảnh gia
              <ArrowRight className="size-3.5" />
            </Link>
            {styleTags.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Xu hướng phong cách
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {styleTags.map((style) => (
                    <span key={style} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      #{style.replace(/\s+/g, "")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lagoon" />
              <span>Lens bảo vệ 100%: tiền chỉ được chuyển cho nhiếp ảnh gia sau khi bạn xác nhận đã nhận ảnh.</span>
            </div>
          </section>

          {nearest?.status === "held" && (
            <Link
              to={"/client/bookings/" + nearest.id + "/gallery"}
              className="flex items-center gap-2 rounded-2xl border border-lagoon/30 bg-lagoon/5 p-4 text-xs text-lagoon"
            >
              <Images className="size-4 shrink-0" />
              <span className="flex-1">Ảnh đã sẵn sàng? Mở bộ sưu tập của bạn.</span>
              <ChevronRight className="size-4" />
            </Link>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
