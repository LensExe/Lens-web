import { useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button, PageContainer, PageHeader, Skeleton, cn, formatPrice } from "@lens/ui";
import { Link } from "react-router-dom";
import { PaymentQrPanel } from "@/components/checkout/PaymentQrPanel";
import { apiErrorMessage } from "@/lib/errors";
import { useWalletSummary } from "@/queries/useWallet";
import {
  useMySubscription,
  useSubscribeToPlan,
  useSubscriptionPaymentQr,
  useSubscriptionPaymentStatus,
  useSubscriptionPlans,
} from "@/queries/useSubscriptions";
import type { ApiPayment } from "@/types/payments";
import type { PaymentMethod } from "@/types/payments";
import type {
  ApiPhotographerSubscription,
  ApiSubscriptionCheckoutResult,
  ApiSubscriptionPlan,
  ApiSubscriptionPlanSnapshot,
  SubscriptionPlanFeatureValue,
} from "@/types/subscriptions";

function formatDate(value: string | null | undefined) {
  if (!value) return "Không thời hạn";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function cycleLabel(days: number) {
  if (days === 30) return "mỗi tháng";
  if (days === 365) return "mỗi năm";
  return `mỗi ${days} ngày`;
}

function featureLabel(feature: SubscriptionPlanFeatureValue) {
  if (typeof feature === "string") return feature;
  return feature.value ? `${feature.name}: ${feature.value}` : feature.name;
}

function paymentError(error: unknown) {
  const message = apiErrorMessage(error, "Không thể đăng ký gói lúc này. Vui lòng thử lại.");
  if (message.includes("Another subscription checkout")) {
    return "Bạn đang có một yêu cầu thanh toán khác đang chờ xử lý. Hãy hoàn tất yêu cầu đó trước.";
  }
  if (message.includes("An active paid subscription must expire")) {
    return "Gói trả phí hiện tại vẫn còn hiệu lực. Bạn có thể đăng ký gói khác sau khi gói này hết hạn.";
  }
  if (message.includes("Insufficient wallet balance")) {
    return "Số dư Ví Lens vừa thay đổi và không còn đủ cho giao dịch. Hãy nạp thêm tiền hoặc thanh toán qua QR.";
  }
  if (message.includes("Payment method cannot change after a subscription checkout")) {
    return "Phương thức thanh toán đã được chốt cho yêu cầu đang chờ. Hãy tiếp tục checkout hiện tại.";
  }
  return message;
}

function paymentString(payment: ApiPayment | undefined, key: "qr_code" | "checkout_url") {
  const value = payment?.[key];
  return typeof value === "string" && value ? value : undefined;
}

export function PhotographerSubscription() {
  const subscriptionQuery = useMySubscription();
  const plansQuery = useSubscriptionPlans();
  const walletQuery = useWalletSummary();
  const subscribe = useSubscribeToPlan();
  const [checkout, setCheckout] = useState<ApiSubscriptionCheckoutResult | null>(null);
  const [requestError, setRequestError] = useState("");
  const subscription = subscriptionQuery.data?.subscription ?? null;
  const pendingSubscription =
    subscriptionQuery.data?.pending_subscription ??
    (subscription?.status === "pending" ? subscription : null);
  const currentPlan =
    subscription?.plan_snapshot ??
    plansQuery.data?.find((plan) => plan.id === subscription?.plan_id) ??
    null;
  const paymentId = checkout?.payment.id ?? "";
  const paymentStatusQuery = useSubscriptionPaymentStatus(paymentId);
  const paymentQrQuery = useSubscriptionPaymentQr(paymentId);
  const payment = paymentStatusQuery.data ?? checkout?.payment;
  const qrData = paymentQrQuery.data;
  const qrCode =
    typeof qrData?.qr_code === "string" ? qrData.qr_code : paymentString(payment, "qr_code");
  const checkoutUrl =
    typeof qrData?.checkout_url === "string"
      ? qrData.checkout_url
      : paymentString(payment, "checkout_url");
  const paymentStatus = String(payment?.status ?? "pending").toLowerCase();
  const paymentPaid = ["paid", "completed", "succeeded"].includes(paymentStatus);
  const paymentReviewPending = Boolean(
    payment?.checkout_expired && payment.checkout_review_required_at,
  );
  const paymentClosed =
    ["failed", "expired", "cancelled"].includes(paymentStatus) ||
    Boolean(payment?.checkout_expired && !payment?.checkout_review_required_at);
  const planId = currentPlan?.id ?? subscription?.plan_id ?? "";
  const isCurrentDefault =
    currentPlan?.is_default === true ||
    (subscription?.status === "active" && Number(subscription.price) === 0);
  const hasActivePaidPlan = subscription?.status === "active" && !isCurrentDefault;
  const pendingPlanId = pendingSubscription
    ? (pendingSubscription.plan_snapshot?.id ?? pendingSubscription.plan_id)
    : "";

  function register(plan: ApiSubscriptionPlan, paymentMethod: PaymentMethod) {
    if (subscribe.isPending) return;
    setRequestError("");
    subscribe.mutate(
      { photographerPlanId: plan.id, paymentMethod },
      {
        onSuccess: (result) => setCheckout(result),
        onError: (error) => setRequestError(paymentError(error)),
      },
    );
  }

  return (
    <PageContainer className="mx-auto max-w-[1200px] py-6 md:py-8">
      <PageHeader
        title="Gói thành viên"
        description="Theo dõi quyền lợi hiện tại và chọn gói subscription phù hợp với studio của bạn."
      />

      <CurrentSubscription
        isLoading={subscriptionQuery.isLoading}
        isError={subscriptionQuery.isError}
        subscription={subscription}
        plan={currentPlan}
      />

      {pendingSubscription && (
        <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
          Yêu cầu cho gói {pendingSubscription.plan_snapshot?.name ?? "đã chọn"} đang chờ thanh toán.
          Phương thức đã chọn được giữ nguyên để tránh trừ tiền hai lần; hãy tiếp tục checkout này.
        </p>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Các gói có thể đăng ký</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quyền lợi của gói mới bắt đầu sau khi thanh toán được xác nhận.
            </p>
          </div>
          {subscription?.status === "active" && subscription.cancel_at_period_end && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <CalendarClock className="size-3.5" /> Gói hiện tại kết thúc{" "}
              {formatDate(subscription.end_at)}
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Số dư khả dụng trong Ví Lens</p>
              <p className="text-sm text-muted-foreground">
                {walletQuery.isLoading
                  ? "Đang kiểm tra số dư..."
                  : walletQuery.isError
                    ? "Chưa thể tải số dư ví"
                    : formatPrice(walletQuery.data?.balance ?? 0)}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/wallet"
            className="text-sm font-medium text-ember underline-offset-4 hover:underline"
          >
            Nạp tiền vào ví
          </Link>
        </div>

        {plansQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
          >
            Không thể tải các gói subscription. Vui lòng tải lại trang.
          </div>
        ) : (plansQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Hiện chưa có gói nào được mở đăng ký.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(plansQuery.data ?? []).map((plan) => {
              const isCurrent = subscription?.status === "active" && plan.id === planId;
              const isPending = plan.id === pendingPlanId;
              const isDefault = plan.is_default === true || plan.price <= 0;
              const blockedByPending = Boolean(pendingPlanId && !isPending);
              const blockedByCurrentPaid = Boolean(hasActivePaidPlan && !isCurrent);
              const walletBalance = walletQuery.data?.balance ?? 0;
              const walletHasEnough = walletBalance >= plan.price;
              const disabled =
                isCurrent ||
                isDefault ||
                blockedByPending ||
                blockedByCurrentPaid ||
                subscribe.isPending;
              let actionLabel = "Đăng ký gói";
              if (isCurrent) actionLabel = "Đang dùng";
              else if (isPending) actionLabel = "Tiếp tục thanh toán";
              else if (isDefault) actionLabel = "Gói miễn phí mặc định";
              else if (blockedByPending) actionLabel = "Có thanh toán đang chờ";
              else if (blockedByCurrentPaid) actionLabel = "Chờ gói hiện tại hết hạn";

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl border bg-card p-5 shadow-xs transition-colors sm:p-6",
                    isCurrent ? "border-ember/50 ring-1 ring-ember/20" : "border-border",
                  )}
                >
                  {isCurrent && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-ember/10 px-2.5 py-1 text-[10px] font-semibold text-ember">
                      <BadgeCheck className="size-3.5" /> Gói hiện tại
                    </span>
                  )}
                  <div className="pr-24">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {plan.code}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{plan.name}</h3>
                  </div>
                  <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-3xl font-bold tracking-tight tabular-nums">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {cycleLabel(plan.billing_cycle)}
                    </span>
                  </p>
                  {plan.description && (
                    <p className="mt-3 min-h-10 text-sm leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                  <ul className="mt-5 flex-1 space-y-3 border-t border-border pt-5 text-sm">
                    {(plan.features ?? []).length ? (
                      (plan.features ?? []).map((feature, index) => (
                        <li
                          key={`${plan.id}-feature-${index}`}
                          className="flex gap-2.5 text-muted-foreground"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <span>{featureLabel(feature)}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex gap-2.5 text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        <span>Quyền lợi cơ bản của Lens</span>
                      </li>
                    )}
                  </ul>
                  <div className="mt-6 grid gap-2">
                    <Button
                      type="button"
                      className={cn(
                        "h-11 w-full rounded-xl",
                        isCurrent && "bg-ember text-white hover:bg-ember/90",
                      )}
                      variant={isCurrent ? "default" : "outline"}
                      disabled={disabled}
                      onClick={() => register(plan, "gateway")}
                    >
                      {subscribe.isPending && <LoaderCircle className="size-4 animate-spin" />}
                      {isPending
                        ? actionLabel
                        : isCurrent || isDefault || blockedByPending || blockedByCurrentPaid
                          ? actionLabel
                          : "Thanh toán qua QR"}
                    </Button>
                    {!isCurrent &&
                      !isPending &&
                      !isDefault &&
                      !blockedByPending &&
                      !blockedByCurrentPaid && (
                        <>
                          <Button
                            type="button"
                            variant="default"
                            className="h-11 w-full rounded-xl"
                            disabled={
                              subscribe.isPending ||
                              walletQuery.isLoading ||
                              walletQuery.isError ||
                              !walletQuery.data ||
                              !walletHasEnough
                            }
                            onClick={() => register(plan, "wallet")}
                          >
                            <Wallet className="size-4" />
                            {walletQuery.isLoading
                              ? "Đang kiểm tra ví..."
                              : walletQuery.isError || !walletQuery.data
                                ? "Ví Lens chưa khả dụng"
                                : walletHasEnough
                                  ? `Thanh toán bằng ví · ${formatPrice(plan.price)}`
                                  : `Ví thiếu ${formatPrice(plan.price - walletBalance)}`}
                          </Button>
                          {!walletQuery.isLoading && walletQuery.isError && (
                            <p className="text-center text-xs text-muted-foreground">
                              Hãy thử lại hoặc chọn thanh toán qua QR.
                            </p>
                          )}
                          {!walletQuery.isLoading && !walletQuery.isError && !walletHasEnough && (
                            <p className="text-center text-xs text-muted-foreground">
                              Nạp thêm tiền để thanh toán gói này bằng ví.
                            </p>
                          )}
                        </>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {requestError && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {requestError}
          </p>
        )}
      </section>

      {checkout && (
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ember">
                Đăng ký subscription
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {checkout.subscription.plan_snapshot?.name ?? "Gói đã chọn"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Thanh toán {formatPrice(checkout.payment.amount ?? checkout.subscription.price)} để
                kích hoạt gói.
              </p>
            </div>
            <PaymentStatusBadge
              paid={paymentPaid}
              closed={paymentClosed}
              reviewPending={paymentReviewPending}
            />
          </div>

          {paymentPaid ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Thanh toán đã được xác nhận</p>
                <p className="mt-1">
                  {payment?.payment_gateway === "wallet_internal"
                    ? "Tiền đã được trừ từ Ví Lens và gói thành viên đã được kích hoạt."
                    : "Gói của bạn đang được cập nhật. Trạng thái subscription sẽ tự làm mới."}
                </p>
              </div>
            </div>
          ) : paymentReviewPending ? (
            <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Đang đối soát giao dịch</p>
              <p className="mt-1">
                Mã thanh toán đã hết hạn và hệ thống đang xác minh với cổng thanh toán. Vui lòng
                không chuyển khoản thêm; trạng thái sẽ tự cập nhật khi có kết quả.
              </p>
            </div>
          ) : paymentClosed ? (
            <p className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              Yêu cầu thanh toán đã đóng. Bạn có thể đăng ký lại gói sau khi hệ thống xác nhận giao
              dịch cũ chưa được thanh toán.
            </p>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
              <div>
                <PaymentQrPanel
                  qrCode={qrCode}
                  checkoutUrl={checkoutUrl}
                  loading={paymentQrQuery.isLoading || paymentQrQuery.isFetching}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Trang sẽ tự kiểm tra giao dịch. Quyền lợi chỉ được kích hoạt sau khi hệ thống nhận
                  xác nhận thanh toán.
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">Đang chờ thanh toán</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(checkout.payment.amount ?? checkout.subscription.price)}
                    </p>
                  </div>
                </div>
                {checkout.payment.checkout_expires_at && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Hết hạn lúc{" "}
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(checkout.payment.checkout_expires_at))}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="mt-4 w-full rounded-xl"
                  onClick={() => void paymentStatusQuery.refetch()}
                  disabled={paymentStatusQuery.isFetching}
                >
                  <RefreshCw
                    className={cn("size-4", paymentStatusQuery.isFetching && "animate-spin")}
                  />
                  Kiểm tra thanh toán
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      <p className="mt-7 flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Thông tin gói đang dùng được đọc từ snapshot đăng ký, vì vậy vẫn hiển thị chính xác kể cả
        khi gói đã được admin chỉnh sửa hoặc ngừng bán.
      </p>
    </PageContainer>
  );
}

function CurrentSubscription({
  isLoading,
  isError,
  subscription,
  plan,
}: {
  isLoading: boolean;
  isError: boolean;
  subscription: ApiPhotographerSubscription | null;
  plan: ApiSubscriptionPlan | ApiSubscriptionPlanSnapshot | null;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    );
  }
  if (isError) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
      >
        Không thể tải subscription hiện tại.
      </p>
    );
  }

  const status = subscription?.status ?? "none";
  const isActive = status === "active";
  const isDefault = isActive && (plan?.is_default === true || Number(subscription?.price) === 0);
  const statusLabel =
    status === "active"
      ? isDefault
        ? "Miễn phí mặc định"
        : "Đang hoạt động"
      : status === "pending"
        ? "Chờ thanh toán"
        : status === "expired"
          ? "Đã hết hạn"
          : status === "cancelled"
            ? "Đã kết thúc"
            : "Chưa đăng ký";
  const statusClass = isActive
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "pending"
      ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
      <article className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ember/10 text-ember">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subscription hiện tại
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {plan?.name ?? (status === "none" ? "Chưa có gói" : "Gói subscription")}
              </h2>
              {plan?.code && <p className="mt-1 text-xs text-muted-foreground">{plan.code}</p>}
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", statusClass)}>
            {statusLabel}
          </span>
        </div>

        {subscription ? (
          <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Giá gói</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatPrice(plan?.price ?? subscription.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Có hiệu lực đến" : "Ngày kết thúc"}
              </p>
              <p className="mt-1 font-semibold">{formatDate(subscription.end_at)}</p>
            </div>
            {subscription.cancel_at_period_end && (
              <p className="sm:col-span-2 text-xs text-amber-700 dark:text-amber-300">
                Gói sẽ kết thúc vào ngày trên và không tiếp tục gia hạn.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Chọn một gói bên dưới để đăng ký subscription cho studio.
          </p>
        )}
      </article>

      <article className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Quyền lợi đang có
        </p>
        {subscription?.status === "active" && (plan?.features ?? []).length ? (
          <ul className="mt-4 space-y-3 text-sm">
            {(plan?.features ?? []).map((feature, index) => (
              <li key={`current-feature-${index}`} className="flex gap-2.5 text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{featureLabel(feature)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {subscription?.status === "pending"
              ? "Thanh toán để kích hoạt quyền lợi của gói đã chọn."
              : "Quyền lợi sẽ hiện tại đây khi subscription hoạt động."}
          </p>
        )}
      </article>
    </section>
  );
}

function PaymentStatusBadge({
  paid,
  closed,
  reviewPending,
}: {
  paid: boolean;
  closed: boolean;
  reviewPending: boolean;
}) {
  if (paid) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-3.5" /> Đã thanh toán
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        closed
          ? "bg-muted text-muted-foreground"
          : "bg-amber-500/10 text-amber-800 dark:text-amber-300",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          closed ? "bg-muted-foreground" : "animate-pulse bg-amber-500",
        )}
      />
      {reviewPending ? "Đang đối soát" : closed ? "Yêu cầu đã đóng" : "Đang chờ thanh toán"}
    </span>
  );
}
