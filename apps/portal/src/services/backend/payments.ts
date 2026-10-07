import { backendGet, backendPost } from "@/lib/backend-api";
import type { ApiItems, ApiObject, ApiPage } from "@/types/common";
import type {
  ApiPayment,
  ApiPaymentHistory,
  ApiWebhookResult,
  DepositPaymentDto,
  PaymentRefundDto,
  PaymentWebhookDto,
  SePayWebhookDto,
  WalletLedgerQueryDto,
  WalletTopUpDto,
  WalletWithdrawalDto,
} from "@/types/payments";

export const getWallet = () => backendGet<ApiObject>("/wallet");

export const getWalletLedger = (query: WalletLedgerQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/wallet/ledger", query);

export const createWalletTopUp = (body: WalletTopUpDto) =>
  backendPost<ApiObject, WalletTopUpDto>("/wallet/topups", body);

export const requestWalletWithdrawal = (body: WalletWithdrawalDto) =>
  backendPost<ApiObject, WalletWithdrawalDto>("/wallet/withdrawals", body);

export const listMyRefundRequests = (query: WalletLedgerQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/me/refund-requests", query);

export const createBookingDepositPayment = (bookingId: string, body: DepositPaymentDto) =>
  backendPost<ApiPayment, DepositPaymentDto>(
    `/bookings/${encodeURIComponent(bookingId)}/payments/deposit`,
    body,
  );

export const createBookingRemainingPayment = (bookingId: string, body: DepositPaymentDto) =>
  backendPost<ApiPayment, DepositPaymentDto>(
    `/bookings/${encodeURIComponent(bookingId)}/payments/remaining`,
    body,
  );

export const getBookingPayments = (bookingId: string) =>
  backendGet<ApiPaymentHistory>(`/bookings/${encodeURIComponent(bookingId)}/payments`);

export const getPayment = (paymentId: string) =>
  backendGet<ApiPayment>(`/payments/${encodeURIComponent(paymentId)}`);

export const getPaymentQr = (paymentId: string) =>
  backendGet<ApiObject>(`/payments/${encodeURIComponent(paymentId)}/qr`);

export const requestPaymentRefund = (paymentId: string, body: PaymentRefundDto) =>
  backendPost<ApiObject, PaymentRefundDto>(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    body,
  );

export const requestBookingRefund = (bookingId: string, body: PaymentRefundDto) =>
  backendPost<ApiObject, PaymentRefundDto>(
    `/bookings/${encodeURIComponent(bookingId)}/refund-requests`,
    body,
  );

export const listPaymentRefunds = (paymentId: string) =>
  backendGet<ApiItems<ApiObject>>(`/payments/${encodeURIComponent(paymentId)}/refunds`);

/** Provider callbacks are normally sent by the payment provider, not a browser. */
export const receivePaymentWebhook = (
  provider: string,
  body: PaymentWebhookDto | SePayWebhookDto,
) =>
  backendPost<ApiWebhookResult, PaymentWebhookDto | SePayWebhookDto>(
    `/payments/webhooks/${encodeURIComponent(provider)}`,
    body,
  );
