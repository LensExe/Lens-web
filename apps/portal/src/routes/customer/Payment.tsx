import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  Button,
  Separator,
  Skeleton,
  Spinner,
  formatPrice,
  PageContainer,
  PageHeader,
} from "@lens/ui";
import { CheckoutResult } from "@/components/checkout/CheckoutResult";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { PaymentQrPanel } from "@/components/checkout/PaymentQrPanel";
import {
  useMyBookings,
  usePayBooking,
  usePaymentQr,
  usePaymentStatus,
} from "@/queries/useBookings";
import { needsRemainingPayment, remainingAmount } from "@/lib/booking";
import type { PaymentMethod } from "@/types";

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Pay the remainder after the deposit. The platform holds the full amount
// until the client confirms delivery.
export function CustomerPayment() {
  const { booking_id = "" } = useParams();
  const { data: bookings = [], isLoading } = useMyBookings();
  const payBooking = usePayBooking(booking_id);
  const paymentAttempt = payBooking.data;
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
  const remaining = booking ? remainingAmount(booking) : 0;

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

  const isPaid =
    booking.status === "released" ||
    (booking.paidAmount ?? 0) >= booking.price ||
    payment?.status === "paid";
  if (isPaid) {
    return (
      <PageContainer>
        <CheckoutResult
          title="Thanh toán thành công!"
          description={
            <>
              Sàn Lens đang giữ toàn bộ tiền buổi chụp với {booking.photographerName}. Sau khi nhận
              đủ ảnh, hãy xác nhận để sàn giải ngân cho nhiếp ảnh gia.
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
              <span>{formatPrice(booking.price)}</span>
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

  // Payment is available after the deposit, and again after the photographer
  // marks the shoot as `shot` when the remaining balance is due.
  if (!needsRemainingPayment(booking)) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">Chưa thể thanh toán</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Bạn chỉ có thể thanh toán phần còn lại sau khi đã đặt cọc và nhiếp ảnh gia xác nhận yêu
          cầu, hoặc khi họ đánh dấu đã chụp.
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
        description={`${booking.photographerName} đã cập nhật trạng thái buổi chụp. Hoàn tất thanh toán phần còn lại để tiếp tục.`}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
        <div className="min-w-0 space-y-4">
          <PaymentMethodPicker
            value={method}
            onChange={paymentAttempt ? () => undefined : setMethod}
            amount={remaining}
          />
          {paymentAttempt && method === "gateway" && (
            <div className="mx-auto w-full max-w-xl">
              <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs text-muted-foreground">
                Đã tạo yêu cầu thanh toán. Quét mã QR bên dưới; trạng thái sẽ tự cập nhật sau khi
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
            Sàn Lens giữ tiền cho đến khi bạn xác nhận đã nhận đủ ảnh. Chính sách hoàn tiền khi huỷ
            được xử lý theo trạng thái lịch đặt trên backend.
          </p>
        </div>

        <aside className="md:sticky md:top-24">
          <CheckoutSummary
            booking={booking}
            lines={[
              { label: "Giá buổi chụp", value: booking.price },
              { label: "Đã đặt cọc", value: booking.depositAmount, tone: "minus" },
            ]}
            dueLabel="Cần thanh toán"
            due={remaining}
          >
            {payBooking.isError && (
              <p className="mb-3 text-sm text-destructive">
                Thanh toán thất bại. Vui lòng thử lại.
              </p>
            )}
            <Button
              size="lg"
              className="h-11 w-full rounded-full"
              disabled={payBooking.isPending || Boolean(paymentAttempt) || !method}
              onClick={() => {
                if (method) payBooking.mutate({ method });
              }}
            >
              {payBooking.isPending && <Spinner />}
              {paymentAttempt
                ? "Đã tạo yêu cầu · quét QR bên dưới"
                : method
                  ? `Thanh toán ${formatPrice(remaining)}`
                  : "Chọn phương thức thanh toán"}
            </Button>
          </CheckoutSummary>
        </aside>
      </div>
    </PageContainer>
  );
}
