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
  billing_cycle: number;
  features: SubscriptionPlanFeatureValue[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Subscription checkout DTOs. */
export interface SubscriptionCreateDto {
  photographer_plan_id: UUID;
  idempotency_key: string;
}
