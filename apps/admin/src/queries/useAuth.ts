import { useMutation, useQuery } from "@tanstack/react-query";
import { getDemoAccounts, login } from "@/services/auth";

// Layer 2 — Query hooks for admin auth.
export const authKeys = {
  demoAccounts: ["auth", "demo-accounts"] as const,
};

export function useAdminLogin() {
  return useMutation({ mutationFn: login });
}

export function useDemoAccounts() {
  return useQuery({
    queryKey: authKeys.demoAccounts,
    queryFn: getDemoAccounts,
    staleTime: Infinity,
  });
}
