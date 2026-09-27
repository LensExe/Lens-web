import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decideApplication, getApplications } from "@/services/applications";
import { queueKey } from "@/queries/useStats";
import type { ApplicationDecision } from "@/types";

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

export function useDecideApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: ApplicationDecision }) =>
      decideApplication(id, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: queueKey });
    },
  });
}
