import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplications, setApplicationStatus } from "@/services/applications";
import type { ApprovalStatus } from "@/types";

// Layer 2 — Query hooks.
export const applicationKeys = {
  all: ["applications"] as const,
};

export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: getApplications,
  });
}

export function useSetApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApprovalStatus }) =>
      setApplicationStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
