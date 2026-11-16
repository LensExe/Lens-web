import { backendGet, backendPost } from "@/lib/backend-api";

export type MobileCheckoutPurpose = "deposit" | "remaining";
export type CheckoutPaymentMethod = "gateway" | "wallet";

export interface MobileCheckoutBooking {
  id: string;
  status: string;
  from: string;
  to: string;
  location: string;
  total_amount: number;
  deposit_amount: number;
  paid_amount?: number;
  photographer?: { fullname?: string };
  booking_plan?: { name?: string };
  package_snapshot?: { name?: string } | null;
}

export interface MobileCheckoutContext {
  booking: MobileCheckoutBooking;
  payment_purpose: MobileCheckoutPurpose;
  return_target: "mobile";
  payment_id: string | null;
  wallet: { balance: number };
}

export interface MobileCheckoutPayment {
  id: string;
  type?: string;
  status?: string;
  amount?: number;
  payment_gateway?: string;
  qr_code?: string | null;
  checkout_url?: string | null;
  [key: string]: unknown;
}

export const exchangeMobileCheckoutHandoff = (code: string) =>
  backendPost<{ expires_in: number }, { code: string }>("/mobile-checkout/handoff/exchange", {
    code,
  });

export const getMobileCheckoutContext = () =>
  backendGet<MobileCheckoutContext>("/mobile-checkout/context");

export const createMobileCheckoutPayment = (input: {
  payment_method: CheckoutPaymentMethod;
  idempotency_key: string;
}) => backendPost<MobileCheckoutPayment, typeof input>("/mobile-checkout/payment-intent", input);

export const getMobileCheckoutPaymentStatus = () =>
  backendGet<MobileCheckoutPayment>("/mobile-checkout/payment-status");

export const getMobileCheckoutPaymentQr = () =>
  backendGet<MobileCheckoutPayment>("/mobile-checkout/payment-qr");
