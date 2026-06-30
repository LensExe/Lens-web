import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Separator,
  Skeleton,
  cn,
  formatPrice,
} from "@lens/ui";
import { useMyBookings, usePayBooking } from "@/queries/useBookings";
import { PAYMENT_METHODS } from "@/lib/booking";
import type { PaymentMethod } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function ClientPayment() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: bookings = [], isLoading } = useMyBookings();
  const payBooking = usePayBooking(id);
  const [method, setMethod] = useState<PaymentMethod>("bank");

  const booking = bookings.find((b) => b.id === id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[860px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy lịch đặt</h1>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/client/bookings">
            <ArrowLeft className="size-4" />
            Về lịch đặt của tôi
          </Link>
        </Button>
      </div>
    );
  }

  // Paid — money is now held in escrow. Show confirmation + next step.
  if (booking.status === "held" || payBooking.isSuccess) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-16 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ember/10 text-ember">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Thanh toán thành công!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sàn Lens đang giữ {formatPrice(booking.price)} cho buổi chụp với{" "}
          {booking.photographerName}. Sau khi nhận đủ ảnh, hãy xác nhận để sàn
          giải ngân cho nhiếp ảnh gia.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left text-sm">
          <SummaryRow label="Nhiếp ảnh gia" value={booking.photographerName} />
          <SummaryRow label="Ngày chụp" value={formatDate(booking.date)} />
          <Separator className="my-3" />
          <div className="flex items-center justify-between font-semibold">
            <span>Sàn đang giữ</span>
            <span>{formatPrice(booking.price)}</span>
          </div>
        </div>

        <Button asChild className="mt-6 rounded-full">
          <Link to="/client/bookings">Về lịch đặt của tôi</Link>
        </Button>
      </div>
    );
  }

  // Payment only applies once the photographer has confirmed.
  if (booking.status !== "confirmed") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[860px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Chưa thể thanh toán</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Bạn chỉ có thể thanh toán sau khi nhiếp ảnh gia xác nhận lịch chụp.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/client/bookings">
            <ArrowLeft className="size-4" />
            Về lịch đặt của tôi
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8">
      <button
        type="button"
        onClick={() => navigate("/client/bookings")}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Về lịch đặt của tôi
      </button>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Thanh toán buổi chụp
        </h1>
        <p className="mt-1 text-muted-foreground">
          Thanh toán toàn bộ để xác nhận buổi chụp với {booking.photographerName}.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Payment methods */}
        <div className="min-w-0 space-y-7">
          <div>
            <h2 className="mb-3 text-base font-semibold">
              Chọn phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                      active
                        ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-foreground" : "border-border"
                      )}
                    >
                      {active && (
                        <span className="size-2.5 rounded-full bg-foreground" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">{m.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {m.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
            <p>
              Sàn Lens giữ tiền cho đến khi bạn xác nhận đã nhận đủ ảnh. Nhiếp
              ảnh gia chỉ nhận được tiền sau khi hoàn thành — nếu buổi chụp bị
              huỷ, bạn được hoàn lại toàn bộ.
            </p>
          </div>

          {payBooking.isError && (
            <p className="text-sm text-destructive">
              Thanh toán thất bại. Vui lòng thử lại.
            </p>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback>
                  {initialsOf(booking.photographerName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">
                  {booking.photographerName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {booking.style}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" />
                <span className="text-foreground">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span className="truncate text-foreground">{booking.location}</span>
              </div>
            </dl>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-base font-semibold">
              <span>Tổng thanh toán</span>
              <span>{formatPrice(booking.price)}</span>
            </div>

            <Button
              className="mt-5 w-full rounded-full"
              disabled={payBooking.isPending}
              onClick={() => payBooking.mutate({ method })}
            >
              {payBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Thanh toán {formatPrice(booking.price)}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
