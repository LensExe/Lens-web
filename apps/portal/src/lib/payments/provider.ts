// Payment / payout ABSTRACTION (ràng buộc pháp lý #1).
//
// Every money movement in Lens flows through ONE PaymentProvider interface. In
// the UI phase the platform self-custodies funds (ManualHoldProvider, mocked in
// src/msw/payments.ts). In Phase 2 a LICENSED intermediary (Payoo/VNPay/…) is
// plugged in by swapping ONLY the provider implementation — the booking,
// commission, cashback and split-payout business logic never changes.
//
// Multi-recipient payout (chia tiền N bên) is first-class from day one so the
// "liên kết thợ" feature reuses this exact seam instead of a 1-photographer model.
//
// NOTE (giả định tạm): shapes are UI-phase mocks; the real provider contract is
// finalized with the backend.

/** One payee's slice of a payout — a booking can release to N recipients. */
export interface PayoutRecipient {
  payeeId: string;
  /** VND this recipient receives (already net of platform commission). */
  amount: number;
}

export interface HoldInput {
  bookingId: string;
  clientId: string;
  amount: number;
}

export interface ReleaseInput {
  bookingId: string;
  recipients: PayoutRecipient[];
}

export interface RefundInput {
  bookingId: string;
  clientId: string;
  amount: number;
}

export interface WithdrawInput {
  userId: string;
  amount: number;
}

export interface CoinInput {
  userId: string;
  amount: number;
  bookingId?: string;
  /** For credits (cashback) — when these coins expire. ISO datetime. */
  expiresAt?: string;
  note?: string;
}

/**
 * The single seam every money/points movement passes through. Business logic
 * (handlers) depends on THIS, not on any concrete gateway.
 */
export interface PaymentProvider {
  /** Client paid → platform holds the money in escrow. */
  hold(input: HoldInput): void;
  /** Client confirmed delivery → escrow released to N photographers. */
  release(input: ReleaseInput): void;
  /** Held booking cancelled → money refunded to the client. */
  refund(input: RefundInput): void;
  /** Cash-out request against a real-money wallet balance. */
  withdraw(input: WithdrawInput): void;
  /** Credit Lens Xu (cashback) — SEPARATE ledger from real money. */
  creditCoins(input: CoinInput): void;
  /** Debit Lens Xu (redeemed at checkout). */
  debitCoins(input: CoinInput): void;
}
