import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, Skeleton, Spinner, formatPrice, PageContainer, PageHeader } from "@lens/ui";
import { CheckoutResult } from "@/components/checkout/CheckoutResult";
import { MessageButton } from "@/components/profile/MessageButton";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { HoldCountdown } from "@/components/checkout/HoldCountdown";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { useMyBookings, usePayDeposit } from "@/queries/useBookings";
import { DEPOSIT_RATE, remainingAmount } from "@/lib/booking";
import type { PaymentMethod } from "@/types";

const NEXT_STEPS = [
  { title: "Nhiếp ảnh gia xác nhận lịch", hint: "Nếu họ từ chối, tiền cọc được hoàn đầy đủ vào ví." },
  { title: "Thanh toán phần còn lại", hint: "Hoàn tất trước buổi chụp, sàn Lens giữ tiền." },
  { title: "Chụp & nhận ảnh", hint: "Xác nhận đã nhận ảnh để sàn giải ngân cho nhiếp ảnh gia." },
];

// Step after booking: pay the deposit to hold the slot. Only then does the
// request reach the photographer.
export function ClientDeposit() {
  const { id = "" } = useParams();
  const { data: bookings = [], isLoading } = useMyBookings();
  const payDeposit = usePayDeposit(id);
  const [method, setMethod] = useState<PaymentMethod>("bank");

  const booking = bookings.find((b) => b.id === id);

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

  const remaining = remainingAmount(booking);
  const pct = Math.round(DEPOSIT_RATE * 100);

  // Just paid → the request is with the photographer.
  if (payDeposit.isSuccess) {
    return (
      <PageContainer>
        <CheckoutResult
          title="Đặt cọc thành công!"
          description={
            <>
              Yêu cầu đặt lịch đã được gửi tới{" "}
              <span className="font-medium text-foreground">{booking.photographerName}</span>.
              Bạn sẽ nhận thông báo khi nhiếp ảnh gia xác nhận.
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
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <MessageButton
              participant={{ id: booking.photographerId, name: booking.photographerName, role: "photographer" }}
              label="Nhắn tin với nhiếp ảnh gia"
              size="default"
            />
            <Button asChild className="rounded-full">
              <Link to={`/client/bookings/${booking.id}`}>Xem lịch đặt</Link>
            </Button>
          </div>
        </CheckoutResult>
      </PageContainer>
    );
  }

  // Nothing to pay here (expired / already past this step).
  if (booking.status !== "awaiting_deposit") {
    const expired = booking.status === "cancelled";
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">
          {expired ? "Lịch đặt đã hết hạn giữ chỗ" : "Lịch đặt này đã được đặt cọc"}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {expired
            ? "Bạn chưa đặt cọc kịp thời gian giữ lịch. Hãy đặt lại để chọn khung giờ còn trống."
            : "Bạn có thể theo dõi tiến trình trong trang chi tiết lịch đặt."}
        </p>
        <Button asChild className="mt-5 rounded-full">
          <Link
            to={expired ? `/photographers/${booking.photographerId}/book` : `/client/bookings/${booking.id}`}
          >
            {expired ? "Đặt lại" : "Xem lịch đặt"}
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
        title="Đặt cọc giữ lịch"
        description={`Cọc ${pct}% để gửi yêu cầu tới ${booking.photographerName}. Hoàn cọc 100% nếu nhiếp ảnh gia từ chối, hoặc nếu bạn huỷ trước khi họ xác nhận.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {booking.depositDeadline && <HoldCountdown deadline={booking.depositDeadline} />}
          <PaymentMethodPicker
            value={method}
            onChange={setMethod}
            amount={booking.depositAmount}
            bookingId={booking.id}
          />
          <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
            Tiền cọc được sàn Lens giữ, chỉ chuyển cho nhiếp ảnh gia sau khi buổi chụp
            hoàn thành và bạn xác nhận đã nhận ảnh.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <CheckoutSummary
            booking={booking}
            lines={[
              { label: "Giá buổi chụp", value: booking.price },
              { label: `Đặt cọc (${pct}%)`, value: booking.depositAmount, hint: "Thanh toán ngay" },
              {
                label: "Còn lại",
                value: remaining,
                tone: "muted",
                hint: "Sau khi nhiếp ảnh gia xác nhận",
              },
            ]}
            dueLabel="Cần thanh toán ngay"
            due={booking.depositAmount}
          >
            {payDeposit.isError && (
              <p className="mb-3 text-sm text-destructive">
                Đặt cọc thất bại. Vui lòng thử lại.
              </p>
            )}
            <Button
              size="lg"
              className="h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90"
              disabled={payDeposit.isPending}
              onClick={() => payDeposit.mutate({ method })}
            >
              {payDeposit.isPending && <Spinner />}
              Xác nhận đặt cọc {formatPrice(booking.depositAmount)}
            </Button>
          </CheckoutSummary>
        </aside>
      </div>
    </PageContainer>
  );
}
