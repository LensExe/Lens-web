import type { ISODateTime, PageQueryDto, UUID } from "./common";

/** Wallet, payment, refund, and payment-webhook DTOs. Amounts are integer VND. */
export type PaymentMethod = "gateway" | "wallet";

export interface PaymentIdempotencyDto {
  idempotency_key: string;
  payment_method?: PaymentMethod;
}

export interface WalletTopUpDto { amount: number; idempotency_key: string }
export type WalletLedgerQueryDto = PageQueryDto;

export interface PayoutDestinationDto {
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface WalletWithdrawalDto {
  amount: number;
  reason: string;
  payout_destination: PayoutDestinationDto;
  idempotency_key: string;
}

export interface PaymentRefundDto {
  amount: number;
  reason: string;
  idempotency_key?: string;
}

export type DepositPaymentDto = PaymentIdempotencyDto;

export interface PaymentWebhookDto {
  code: string;
  desc: string;
  success: boolean;
  data: Record<string, unknown>;
  signature: string;
}

export interface SePayWebhookDto { payload: Record<string, unknown> }

export interface ApiPayment {
  id: UUID;
  amount?: number;
  status?: string;
  [key: string]: unknown;
}

export interface ApiPaymentHistory {
  items: ApiPayment[];
  escrow_release_at: ISODateTime | null;
  refund_request_deadline_at: ISODateTime | null;
}

export interface ApiWebhookResult {
  received: boolean;
  duplicate: boolean;
}
