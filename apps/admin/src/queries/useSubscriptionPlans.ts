import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from "@/services/backend/admin";
import type { SubscriptionPlanCreateDto, SubscriptionPlanUpdateDto } from "@/types/backend-api";

export const subscriptionPlansKey = ["admin", "subscription-plans"] as const;

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionPlansKey,
    queryFn: listSubscriptionPlans,
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubscriptionPlanCreateDto) => createSubscriptionPlan(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionPlansKey }),
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SubscriptionPlanUpdateDto }) =>
      updateSubscriptionPlan(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionPlansKey }),
  });
}
