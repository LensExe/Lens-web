import { backendGet, backendPost } from "@/lib/backend-api";
import type { ApiObject, ApiItems } from "@/types/common";
import type { ApiWebhookResult, PaymentWebhookDto } from "@/types/payments";
import type { ApiSubscriptionPlan, SubscriptionCreateDto } from "@/types/subscriptions";

export const listPlans = () => backendGet<ApiItems<ApiSubscriptionPlan>>("/subscriptions/plans");
export const getMySubscription = () => backendGet<ApiObject>("/subscriptions/me");
export const getMySubscriptionUsage = () => backendGet<ApiObject>("/subscriptions/me/usage");
export const getMySubscriptionHistory = () =>
  backendGet<ApiItems<ApiObject>>("/subscriptions/me/history");
export const createSubscription = (body: SubscriptionCreateDto) =>
  backendPost<ApiObject, SubscriptionCreateDto>("/subscriptions", body);
export const cancelSubscription = (subscriptionId: string) =>
  backendPost<ApiObject>(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`);
/** Provider callback endpoint; normally invoked by the payment service. */
export const receiveSubscriptionWebhook = (provider: string, body: PaymentWebhookDto) =>
  backendPost<ApiWebhookResult, PaymentWebhookDto>(
    `/subscriptions/webhooks/${encodeURIComponent(provider)}`,
    body,
  );
