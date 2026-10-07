import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, Skeleton, Spinner, formatPrice, PageContainer, PageHeader } from "@lens/ui";
import { CheckoutResult } from "@/components/checkout/CheckoutResult";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { HoldCountdown } from "@/components/checkout/HoldCountdown";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { PaymentQrPanel } from "@/components/checkout/PaymentQrPanel";
import {
  useMyBookings,
  usePayDeposit,
  usePaymentQr,
  usePaymentStatus,
} from "@/queries/useBookings";
import { DEPOSIT_RATE, remainingAmount } from "@/lib/booking";
import type { PaymentMethod } from "@/types";

const NEXT_STEPS = [
  {
    title: "Chờ nhiếp ảnh gia xác nhận",
    hint: "Yêu cầu chỉ được xác nhận sau khi tiền cọc ghi nhận.",
  },
  { title: "Thanh toán phần còn lại", hint: "Hoàn tất trước buổi chụp; Lens giữ tiền an toàn." },
  { title: "Chụp & nhận ảnh", hint: "Theo dõi ảnh trong trang bộ sưu tập của lịch đặt." },
  { title: "Xác nhận đã nhận ảnh", hint: "Lens giải ngân cho nhiếp ảnh gia sau khi bạn xác nhận." },
];

// The client pays the deposit before the photographer can accept the booking.
export function CustomerDeposit() {
  const { booking_id = "" } = useParams();
  const { data: bookings = [], isLoading } = useMyBookings();
  const payDeposit = usePayDeposit(booking_id);
  const paymentAttempt = payDeposit.data;
  const paymentStatus = usePaymentStatus(paymentAttempt?.payment.id ?? "");
  const paymentQr = usePaymentQr(paymentAttempt?.payment.id ?? "");
  const payment = paymentStatus.data ?? paymentAttempt?.payment;
  const qrCode =
    typeof paymentQr.data?.qr_code === "string"
      ? paymentQr.data.qr_code
      : typeof paymentAttempt?.payment.qr_code === "string"
        ? paymentAttempt.payment.qr_code
        : undefined;
  const checkoutUrl =
    typeof paymentQr.data?.checkout_url === "string"
      ? paymentQr.data.checkout_url
      : typeof paymentAttempt?.payment.checkout_url === "string"
        ? paymentAttempt.payment.checkout_url
        : undefined;
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  const booking = bookings.find((b) => b.id === booking_id);

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-64 rounded-xl" />
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_380px]">
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

  const remaining = remainingAmount(booking);
  const pct = Math.round(DEPOSIT_RATE * 100);
  const isPaid =
    payment?.status === "paid" ||
    (booking.paidAmount ?? 0) >= booking.depositAmount ||
    booking.status === "confirmed" ||
    booking.status === "held" ||
    booking.status === "released";

  if (isPaid) {
    return (
      <PageContainer>
        <CheckoutResult
          title="Đặt cọc thành công!"
          description={
            <>
              Đã thanh toán cọc cho lịch chụp với{" "}
              <span className="font-medium text-foreground">{booking.photographerName}</span> đã
              được gửi tới nhiếp ảnh gia để xác nhận. Thanh toán phần còn lại trước buổi chụp.
            </>
          }
        >
          <ol className="space-y-3 rounded-3xl border border-border bg-card p-5">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {step.title}
                    {i === 1 && (
                      <span className="text-muted-foreground"> · {formatPrice(remaining)}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.hint}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-full">
              <Link to={`/client/bookings/${booking.id}`}>Xem lịch đặt</Link>
            </Button>
          </div>
        </CheckoutResult>
      </PageContainer>
    );
  }

  // A pending booking is the customer's deposit step. The backend then lets
  // the photographer accept only after this transaction is paid.
  if (booking.status !== "awaiting_deposit") {
    const cancelled = booking.status === "cancelled";
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">
          {cancelled ? "Lịch đặt đã bị huỷ" : "Chưa thể đặt cọc"}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {cancelled
            ? "Lịch đặt này đã bị huỷ. Hãy chọn lịch khác nếu bạn vẫn muốn đặt buổi chụp."
            : "Thanh toán tiền cọc trước để nhiếp ảnh gia có thể xác nhận yêu cầu đặt lịch."}
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link to={`/client/bookings/${booking.id}`}>Xem lịch đặt</Link>
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
        title="Đặt cọc giữ lịch"
        description={`Cọc ${pct}% để giữ lịch với ${booking.photographerName}.`}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
        <div className="min-w-0 space-y-4">
          {booking.depositDeadline && <HoldCountdown deadline={booking.depositDeadline} />}
          <PaymentMethodPicker
            value={method}
            onChange={paymentAttempt ? () => undefined : setMethod}
            amount={booking.depositAmount}
          />
          {paymentAttempt && method === "gateway" && (
            <div className="mx-auto w-full max-w-xl">
              <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-muted-foreground">
                Đã tạo yêu cầu đặt cọc. Quét mã QR bên dưới; trạng thái sẽ tự cập nhật sau khi
                gateway xác nhận.
              </p>
              <PaymentQrPanel
                loading={paymentQr.isLoading || paymentQr.isFetching}
                qrCode={qrCode}
                checkoutUrl={checkoutUrl}
              />
            </div>
          )}
          <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
            Tiền cọc được sàn Lens giữ cùng khoản thanh toán còn lại cho đến khi bạn xác nhận đã
            nhận ảnh.
          </p>
        </div>

        <aside className="md:sticky md:top-24">
          <CheckoutSummary
            booking={booking}
            lines={[
              { label: "Giá buổi chụp", value: booking.price },
              { label: `Đặt cọc (${pct}%)`, value: booking.depositAmount, hint: "Thanh toán ngay" },
              {
                label: "Còn lại",
                value: remaining,
                tone: "muted",
                hint: "Thanh toán trước buổi chụp",
              },
            ]}
            dueLabel="Cần thanh toán ngay"
            due={booking.depositAmount}
          >
            {payDeposit.isError && (
              <p className="mb-3 text-sm text-destructive">Đặt cọc thất bại. Vui lòng thử lại.</p>
            )}
            <Button
              size="lg"
              className="h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90"
              disabled={payDeposit.isPending || Boolean(paymentAttempt) || !method}
              onClick={() => {
                if (method) payDeposit.mutate({ method });
              }}
            >
              {payDeposit.isPending && <Spinner />}
              {paymentAttempt
                ? "Đã tạo yêu cầu · quét QR bên dưới"
                : method
                  ? `Xác nhận đặt cọc ${formatPrice(booking.depositAmount)}`
                  : "Chọn phương thức thanh toán"}
            </Button>
          </CheckoutSummary>
        </aside>
      </div>
    </PageContainer>
  );
}
