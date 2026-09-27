import { useMutation, useQuery } from "@tanstack/react-query";
import { getDemoAccounts, login, register } from "@/services/auth";

// Layer 2 — Query hooks for auth. The ONLY layer the View talks to.
export const authKeys = {
  demoAccounts: ["auth", "demo-accounts"] as const,
};

export function useLogin() {
  return useMutation({ mutationFn: login });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useDemoAccounts() {
  return useQuery({
    queryKey: authKeys.demoAccounts,
    queryFn: getDemoAccounts,
    staleTime: Infinity,
  });
}
