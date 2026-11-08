import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button, PageContainer, formatPrice } from "@lens/ui";
import { CheckoutResult } from "@/components/checkout/CheckoutResult";
import { PaymentMethodPicker } from "@/components/checkout/PaymentMethodPicker";
import { PaymentQrPanel } from "@/components/checkout/PaymentQrPanel";
import {
  createMobileCheckoutPayment,
  getMobileCheckoutContext,
  getMobileCheckoutPaymentQr,
  getMobileCheckoutPaymentStatus,
  type CheckoutPaymentMethod,
  type MobileCheckoutPurpose,
} from "@/services/mobile-checkout";

const paidStatuses = new Set(["paid", "completed", "succeeded"]);

function money(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function deepLink(bookingId: string, purpose: MobileCheckoutPurpose) {
  const query = new URLSearchParams({ bookingId, paymentPurpose: purpose });
  return `lens://checkout/return?${query.toString()}`;
}

export function MobileCheckout() {
  const contextQuery = useQuery({
    queryKey: ["mobile-checkout", "context"],
    queryFn: getMobileCheckoutContext,
    retry: false,
  });
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [method, setMethod] = useState<CheckoutPaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const autoReturnStarted = useRef(false);

  useEffect(() => {
    if (contextQuery.data?.payment_id) setPaymentId(contextQuery.data.payment_id);
  }, [contextQuery.data?.payment_id]);

  const statusQuery = useQuery({
    queryKey: ["mobile-checkout", "payment-status", paymentId],
    queryFn: getMobileCheckoutPaymentStatus,
    enabled: Boolean(paymentId),
    refetchInterval: (query) =>
      paidStatuses.has(String(query.state.data?.status ?? "").toLowerCase()) ? false : 2500,
  });
  const payment = statusQuery.data;
  const isPaid = paidStatuses.has(String(payment?.status ?? "").toLowerCase());
  const inferredMethod: CheckoutPaymentMethod | null =
    payment?.payment_gateway === "wallet_internal" ? "wallet" : paymentId ? "gateway" : null;
  const activeMethod = method ?? inferredMethod;
  const qrQuery = useQuery({
    queryKey: ["mobile-checkout", "payment-qr", paymentId],
    queryFn: getMobileCheckoutPaymentQr,
    enabled: Boolean(paymentId) && activeMethod === "gateway" && !isPaid,
    retry: false,
  });

  const context = contextQuery.data;
  const booking = context?.booking;
  const purpose = context?.payment_purpose;
  const amount = useMemo(() => {
    if (!booking || !purpose) return 0;
    return purpose === "deposit"
      ? money(booking.deposit_amount)
      : Math.max(0, money(booking.total_amount) - money(booking.deposit_amount));
  }, [booking, purpose]);
  const returnUrl = booking && purpose ? deepLink(booking.id, purpose) : undefined;

  useEffect(() => {
    if (!isPaid || !booking || !purpose || autoReturnStarted.current) return;
    if (!/android|iphone|ipad|ipod/i.test(navigator.userAgent)) return;
    autoReturnStarted.current = true;
    const timer = window.setTimeout(
      () => window.location.assign(deepLink(booking.id, purpose)),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [booking, isPaid, purpose]);

  const startPayment = async () => {
    if (!context || !method || submitting || paymentId) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const result = await createMobileCheckoutPayment({
        payment_method: method,
        // Stable across reloads so a retry after a dropped response reuses the
        // same booking intent rather than producing another charge attempt.
        idempotency_key: `mobile-checkout:${context.booking.id}:${context.payment_purpose}`,
      });
      setPaymentId(result.id);
    } catch {
      setSubmitError(
        "Không thể tạo yêu cầu thanh toán. Nếu booking đã có yêu cầu thanh toán trước đó, phương thức đã chọn có thể không khớp với yêu cầu đang chờ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (contextQuery.isLoading) {
    return (
      <PageContainer className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin text-ember" />
          Đang tải thông tin thanh toán...
        </div>
      </PageContainer>
    );
  }

  if (contextQuery.isError || !context || !booking || !purpose) {
    return (
      <PageContainer className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <AlertCircle className="size-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Phiên thanh toán không còn hiệu lực</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Hãy quay lại ứng dụng Lens và mở thanh toán từ đúng lịch đặt.
        </p>
      </PageContainer>
    );
  }

  if (isPaid) {
    return (
      <PageContainer>
        <CheckoutResult
          title={purpose === "deposit" ? "Đặt cọc thành công!" : "Thanh toán thành công!"}
          description="Khoản thanh toán đã được Backend xác nhận cho đúng lịch đặt. Đang quay lại ứng dụng Lens..."
        >
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">Mã lịch đặt</span>
              <span className="font-medium">{booking.id}</span>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <span className="text-muted-foreground">Khoản thanh toán</span>
              <span className="font-medium">{formatPrice(amount)}</span>
            </div>
          </div>
          {returnUrl && (
            <Button asChild className="mt-5 w-full rounded-full">
              <a href={returnUrl}>Quay lại ứng dụng Lens</a>
            </Button>
          )}
        </CheckoutResult>
      </PageContainer>
    );
  }

  const qrCode =
    typeof qrQuery.data?.qr_code === "string"
      ? qrQuery.data.qr_code
      : typeof payment?.qr_code === "string"
        ? payment.qr_code
        : undefined;
  const checkoutUrl =
    typeof qrQuery.data?.checkout_url === "string"
      ? qrQuery.data.checkout_url
      : typeof payment?.checkout_url === "string"
        ? payment.checkout_url
        : undefined;

  return (
    <PageContainer className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-ember">THANH TOÁN LỊCH ĐẶT</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {purpose === "deposit" ? "Thanh toán đặt cọc" : "Thanh toán phần còn lại"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn cách thanh toán cho lịch đặt{" "}
          <span className="font-medium text-foreground">{booking.id}</span>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
        <div className="space-y-4">
          {paymentId ? (
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-semibold">Yêu cầu thanh toán đã được tạo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Trạng thái: {payment?.status ?? "đang chờ cổng thanh toán xác nhận"}. Trang sẽ tự
                cập nhật.
              </p>
            </div>
          ) : (
            <PaymentMethodPicker
              value={method}
              onChange={setMethod}
              amount={amount}
              walletBalanceOverride={money(context.wallet.balance)}
            />
          )}

          {activeMethod === "gateway" && paymentId && (
            <PaymentQrPanel
              loading={qrQuery.isLoading || qrQuery.isFetching}
              qrCode={qrCode}
              checkoutUrl={checkoutUrl}
            />
          )}

          {submitError && (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {submitError}
            </p>
          )}

          <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Thông tin booking và tài khoản đã được xác thực từ ứng dụng Lens. Kết quả thanh toán chỉ
            hoàn tất sau khi Backend xác nhận.
          </p>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6 md:sticky md:top-6">
          <h2 className="font-semibold">Thông tin thanh toán</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Gói chụp</span>
              <span className="text-right font-medium">
                {booking.package_snapshot?.name ?? booking.booking_plan?.name ?? "Lịch chụp"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Thời gian</span>
              <span className="text-right font-medium">
                {new Date(booking.from).toLocaleString("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Địa điểm</span>
              <span className="text-right font-medium">{booking.location}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between gap-4 font-semibold">
                <span>{purpose === "deposit" ? "Tiền cọc" : "Còn lại"}</span>
                <span>{formatPrice(amount)}</span>
              </div>
            </div>
          </div>
          {!paymentId && (
            <Button
              className="mt-6 h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90"
              disabled={!method || submitting}
              onClick={() => void startPayment()}
            >
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              {submitting ? "Đang tạo yêu cầu..." : `Tiếp tục thanh toán ${formatPrice(amount)}`}
            </Button>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
