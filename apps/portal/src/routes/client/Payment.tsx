import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  Button,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  formatPrice,
  PageContainer,
  PageHeader,
} from "@lens/ui";
import { CheckoutResult } from "@/components/checkout/CheckoutResult";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { useMyBookings, usePayBooking } from "@/queries/useBookings";
import { useCoinSummary } from "@/queries/useWallet";
import { FREE_CANCEL_DAYS, remainingAmount } from "@/lib/booking";
import { COIN_LABEL, formatCoins, maxRedeemableCoins } from "@/lib/wallet";
import type { PaymentMethod } from "@/types";

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Pay the remainder (after the deposit) once the photographer has confirmed.
// The platform then holds the full amount until the client confirms delivery.
export function ClientPayment() {
  const { id = "" } = useParams();
  const { data: bookings = [], isLoading } = useMyBookings();
  const { data: coinSummary } = useCoinSummary();
  const payBooking = usePayBooking(id);
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);

  const booking = bookings.find((b) => b.id === id);
  const remaining = booking ? remainingAmount(booking) : 0;

  // Lens Xu apply to the remainder (cap % of the order + their balance).
  const coinBalance = coinSummary?.balance ?? 0;
  const redeemMax = booking
    ? Math.min(maxRedeemableCoins(booking.price, coinBalance), remaining)
    : 0;
  const coinsApplied = useCoins ? Math.min(coinAmount, redeemMax) : 0;
  const cashDue = remaining - coinsApplied;

  const toggleCoins = (on: boolean) => {
    setUseCoins(on);
    setCoinAmount(on ? redeemMax : 0);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-64 rounded-xl" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy lịch đặt</h1>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/client/bookings">
            <ArrowLeft className="size-4" />
            Về lịch đặt của tôi
          </Link>
        </Button>
      </PageContainer>
    );
  }

  // Paid — money is now held in escrow. Show confirmation + next step.
  if (booking.status === "held" || payBooking.isSuccess) {
    return (
      <PageContainer>
        <CheckoutResult
          title="Thanh toán thành công!"
          description={
            <>
              Sàn Lens đang giữ toàn bộ tiền buổi chụp với {booking.photographerName}. Sau
              khi nhận đủ ảnh, hãy xác nhận để sàn giải ngân cho nhiếp ảnh gia.
            </>
          }
        >
          <div className="rounded-3xl border border-border bg-card p-5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Nhiếp ảnh gia</span>
              <span className="font-medium">{booking.photographerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Ngày chụp</span>
              <span className="font-medium">{formatDate(booking.date)}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-semibold">
              <span>Sàn đang giữ</span>
              <span>{formatPrice(booking.price - (booking.coinsRedeemed ?? 0))}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-full">
              <Link to={`/client/bookings/${booking.id}`}>Xem lịch đặt</Link>
            </Button>
          </div>
        </CheckoutResult>
      </PageContainer>
    );
  }

  // Payment only applies once the photographer has confirmed.
  if (booking.status !== "confirmed") {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">Chưa thể thanh toán</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Bạn chỉ có thể thanh toán phần còn lại sau khi nhiếp ảnh gia xác nhận lịch chụp.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to={`/client/bookings/${booking.id}`}>
            <ArrowLeft className="size-4" />
            Chi tiết lịch đặt
          </Link>
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        to={`/client/bookings/${booking.id}`}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Chi tiết lịch đặt
      </Link>

      <PageHeader
        title="Thanh toán phần còn lại"
        description={`${booking.photographerName} đã xác nhận lịch chụp. Hoàn tất thanh toán trước buổi chụp.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <PaymentMethodPicker
            value={method}
            onChange={setMethod}
            amount={cashDue}
            bookingId={booking.id}
          />

          {/* Lens Xu redemption — reduces the cash charged (capped per order). */}
          {redeemMax > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">Dùng {COIN_LABEL} để trừ tiền</p>
                  <p className="text-sm text-muted-foreground">
                    Bạn có {formatCoins(coinBalance)} · tối đa {formatCoins(redeemMax)} cho
                    đơn này
                  </p>
                </div>
                <Switch
                  checked={useCoins}
                  onCheckedChange={toggleCoins}
                  aria-label={`Dùng ${COIN_LABEL}`}
                />
              </div>
              {useCoins && (
                <div className="mt-4">
                  <Slider
                    min={0}
                    max={redeemMax}
                    step={1000}
                    value={[coinAmount]}
                    onValueChange={([v]) => setCoinAmount(v)}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Áp dụng</span>
                    <span className="font-medium">{formatCoins(coinsApplied)}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
            Sàn Lens giữ tiền cho đến khi bạn xác nhận đã nhận đủ ảnh. Huỷ trước buổi chụp
            từ {FREE_CANCEL_DAYS} ngày trở lên được hoàn 100%; huỷ muộn hơn sẽ mất tiền cọc.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <CheckoutSummary
            booking={booking}
            lines={[
              { label: "Giá buổi chụp", value: booking.price },
              { label: "Đã đặt cọc", value: booking.depositAmount, tone: "minus" },
              ...(coinsApplied > 0
                ? [{ label: `Trừ ${COIN_LABEL}`, value: coinsApplied, tone: "minus" as const }]
                : []),
            ]}
            dueLabel="Cần thanh toán"
            due={cashDue}
          >
            {payBooking.isError && (
              <p className="mb-3 text-sm text-destructive">Thanh toán thất bại. Vui lòng thử lại.</p>
            )}
            <Button
              size="lg"
              className="h-11 w-full rounded-full"
              disabled={payBooking.isPending}
              onClick={() => payBooking.mutate({ method, coinsToRedeem: coinsApplied })}
            >
              {payBooking.isPending && <Spinner />}
              Thanh toán {formatPrice(cashDue)}
            </Button>
          </CheckoutSummary>
        </aside>
      </div>
    </PageContainer>
  );
}
