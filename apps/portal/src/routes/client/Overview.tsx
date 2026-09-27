import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  MessageSquare,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import { Button, Skeleton, cn, PageContainer, formatPrice } from "@lens/ui";
import { GreetingBanner } from "@/components/workspace/GreetingBanner";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import { useConversations } from "@/queries/useMessages";
import { BOOKING_STATUS_META } from "@/lib/booking";
import { currentUser } from "@/lib/session";
import { useMyProfile } from "@/queries/useProfile";
import type { BookingStatus } from "@/types";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Full escrow lifecycle, in the order a booking travels through it.
const STATUS_ORDER: BookingStatus[] = [
  "awaiting_deposit",
  "pending",
  "confirmed",
  "held",
  "released",
  "cancelled",
];

// Status dot per tile — the only colour on these tiles (matches BOOKING_STATUS_META).
const STATUS_DOT: Record<BookingStatus, string> = {
  awaiting_deposit: "bg-orange-500",
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  held: "bg-violet-500",
  released: "bg-emerald-500",
  cancelled: "bg-muted-foreground/40",
};

// Tiles that need the client's action link to the bookings list.
const TILE_CTA: Partial<Record<BookingStatus, string>> = {
  awaiting_deposit: "Đặt cọc →",
  confirmed: "Thanh toán →",
};

/** Compact stat tile — coloured left accent + dot, big number, small label.
 *  Used for the total and each booking status. */
function Tile({
  count,
  label,
  dot,
  to,
  cta,
}: {
  count: number;
  label: string;
  dot: string;
  to?: string;
  cta?: string;
}) {
  const body = (
    <>
      <span className={cn("block size-2.5 rounded-full", dot)} />
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {cta && (
        <p className="mt-1 text-xs font-medium text-foreground underline underline-offset-2">{cta}</p>
      )}
    </>
  );

  const cls = "rounded-2xl border border-border bg-card p-4";
  if (to) {
    return (
      <Link to={to} className={cn(cls, "transition-colors hover:bg-muted/40")}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** One "things to do" row in the side panel. */
function TodoItem({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: typeof Star;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function ClientOverview() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const { data: conversations = [] } = useConversations();
  const unread = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const { data: profile } = useMyProfile();
  const today = todayISO();
  const upcoming = bookings.filter(
    (b) =>
      b.date >= today &&
      (b.status === "awaiting_deposit" ||
        b.status === "pending" ||
        b.status === "confirmed" ||
        b.status === "held")
  );
  const countOf = (status: BookingStatus) =>
    bookings.filter((b) => b.status === status).length;
  const toDeposit = countOf("awaiting_deposit");
  const toPay = countOf("confirmed");
  const toReview = countOf("released");
  // The one thing to do next, most urgent first (unpaid holds expire).
  const firstToDeposit = bookings.find((b) => b.status === "awaiting_deposit");
  const firstToPay = bookings.find((b) => b.status === "confirmed");
  const summary = isLoading
    ? "Đang tải lịch của bạn…"
    : firstToDeposit
      ? `Bạn có ${toDeposit} lịch chờ đặt cọc — đặt cọc sớm để giữ khung giờ.`
      : firstToPay
        ? `Bạn có ${toPay} lịch chờ thanh toán phần còn lại trước buổi chụp.`
        : upcoming.length > 0
          ? `Bạn có ${upcoming.length} buổi chụp sắp tới. Mọi việc đều đã sẵn sàng.`
          : "Chưa có buổi chụp nào sắp tới — tìm nhiếp ảnh gia cho khoảnh khắc tiếp theo.";

  return (
    <PageContainer>
      <GreetingBanner
        title={`Chào, ${profile?.name ?? currentUser.name}`}
        summary={summary}
        action={
          firstToDeposit ? (
            <Button asChild className="rounded-full bg-ember text-white hover:bg-ember/90">
              <Link to={`/client/bookings/${firstToDeposit.id}/deposit`}>
                <Wallet className="size-4" />
                Đặt cọc {formatPrice(firstToDeposit.depositAmount)}
              </Link>
            </Button>
          ) : firstToPay ? (
            <Button asChild className="rounded-full bg-ember text-white hover:bg-ember/90">
              <Link to={`/client/bookings/${firstToPay.id}/pay`}>
                <CreditCard className="size-4" />
                Thanh toán ngay
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full bg-ember text-white hover:bg-ember/90">
              <Link to="/">
                <Search className="size-4" />
                Tìm nhiếp ảnh gia
              </Link>
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <Tile
            count={bookings.length}
            label="Tổng buổi chụp"
            dot="bg-foreground"
          />
          {STATUS_ORDER.map((status) => {
            const count = countOf(status);
            return (
              <Tile
                key={status}
                count={count}
                label={BOOKING_STATUS_META[status].label}
                dot={STATUS_DOT[status]}
                to={TILE_CTA[status] && count > 0 ? "/client/bookings" : undefined}
                cta={count > 0 ? TILE_CTA[status] : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarClock className="size-5 text-muted-foreground" />
              Buổi chụp sắp tới
            </h2>
            <Link
              to="/client/bookings"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <CalendarCheck className="size-6" />
              </span>
              <p className="font-medium">Chưa có buổi chụp nào sắp tới</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tìm nhiếp ảnh gia phù hợp và đặt lịch cho khoảnh khắc của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 px-2 text-sm font-semibold">Việc cần làm</h2>
            {toDeposit === 0 && toPay === 0 && toReview === 0 && unread === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Bạn đã xử lý xong mọi việc.
              </p>
            ) : (
              <div className="space-y-0.5">
                {toDeposit > 0 && (
                  <TodoItem
                    to="/client/bookings"
                    icon={Wallet}
                    title={`${toDeposit} lịch chờ đặt cọc`}
                    hint="Đặt cọc để giữ lịch với nhiếp ảnh gia"
                  />
                )}
                {toPay > 0 && (
                  <TodoItem
                    to="/client/bookings"
                    icon={CreditCard}
                    title={`${toPay} lịch chờ thanh toán`}
                    hint="Thanh toán phần còn lại trước buổi chụp"
                  />
                )}
                {toReview > 0 && (
                  <TodoItem
                    to="/client/reviews"
                    icon={Star}
                    title={`${toReview} buổi chụp đã hoàn thành`}
                    hint="Chia sẻ đánh giá của bạn"
                  />
                )}
                {/* Messages only count as a task when someone is waiting on a reply. */}
                {unread > 0 && (
                  <TodoItem
                    to="/messages"
                    icon={MessageSquare}
                    title={`${unread} tin nhắn chưa đọc`}
                    hint="Nhiếp ảnh gia đang chờ bạn phản hồi"
                  />
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-lg font-semibold leading-snug">
              Sẵn sàng cho buổi chụp tiếp theo?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lọc theo phong cách, ngân sách và ngày bạn cần.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-full bg-card">
              <Link to="/">
                <Search className="size-4" />
                Tìm nhiếp ảnh gia
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
