import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminCustomerProfile,
  getAdminUserAccount,
  getAdminUserBookings,
  getUsers,
  setUserStatus,
} from "@/services/users";
import { queueKey } from "@/queries/useStats";
import type { UserStatus } from "@/types";

// Layer 2 — Query hooks.
export const userKeys = {
  all: ["users"] as const,
  account: (id: string) => ["users", "account", id] as const,
  customerProfile: (id: string) => ["users", "customer-profile", id] as const,
  bookings: (id: string) => ["users", "bookings", id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: getUsers,
  });
}

export function useAdminUserAccount(id: string) {
  return useQuery({
    queryKey: userKeys.account(id),
    queryFn: () => getAdminUserAccount(id),
    enabled: Boolean(id),
  });
}

export function useAdminCustomerProfile(id: string) {
  return useQuery({
    queryKey: userKeys.customerProfile(id),
    queryFn: () => getAdminCustomerProfile(id),
    enabled: Boolean(id),
  });
}

export function useAdminUserBookings(id: string) {
  return useQuery({
    queryKey: userKeys.bookings(id),
    queryFn: () => getAdminUserBookings(id),
    enabled: Boolean(id),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      setUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      qc.invalidateQueries({ queryKey: queueKey });
    },
  });
}
