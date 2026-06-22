import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsers, setUserStatus } from "@/services/users";
import type { UserStatus } from "@/types";

// Layer 2 — Query hooks.
export const userKeys = {
  all: ["users"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: getUsers,
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      setUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
