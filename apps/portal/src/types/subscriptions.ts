import type { ISODateTime, UUID } from "./common";

export interface SubscriptionPlanFeature {
  code: string;
  name: string;
  value: string;
}

/** A photographer membership entitlement returned by the backend. */
export type SubscriptionPlanFeatureValue = string | SubscriptionPlanFeature;

/** A purchasable Lens membership plan for photographers (not a booking plan). */
export interface ApiSubscriptionPlan {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  /** Backend may expose the lifecycle state separately from is_active. */
  status?: string;
  is_default?: boolean;
  billing_cycle: number;
  features: SubscriptionPlanFeatureValue[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Subscription checkout DTOs. */
export interface SubscriptionCreateDto {
  photographer_plan_id: UUID;
  idempotency_key: string;
  payment_method?: import("./payments").PaymentMethod;
}

export interface ApiSubscriptionPlanSnapshot {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: number;
  features: SubscriptionPlanFeatureValue[];
  is_default?: boolean;
}

export interface ApiPhotographerSubscription {
  id: UUID;
  plan_id: UUID;
  plan_snapshot: ApiSubscriptionPlanSnapshot | null;
  start_at: ISODateTime;
  end_at: ISODateTime | null;
  status: "pending" | "active" | "expired" | "cancelled" | string;
  price: number;
  auto_renew?: boolean;
  cancel_at_period_end?: boolean;
}

export interface ApiMySubscriptionResponse {
  subscription: ApiPhotographerSubscription | null;
  pending_subscription: ApiPhotographerSubscription | null;
  features: SubscriptionPlanFeatureValue[];
}

export interface ApiSubscriptionCheckoutResult {
  subscription: ApiPhotographerSubscription;
  payment: import("./payments").ApiPayment;
}
