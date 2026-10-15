import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  decideApplication,
  getApplicationPortfolio,
  getApplications,
} from "@/services/applications";
import { queueKey } from "@/queries/useStats";
import type { ApplicationDecision, PhotographerApplication } from "@/types";

// Layer 2 — Query hooks.
export const applicationKeys = {
  all: ["applications"] as const,
  portfolio: (id: string) => ["applications", id, "portfolio"] as const,
};

export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: getApplications,
  });
}

export function useApplicationPortfolio(id: string) {
  return useQuery({
    queryKey: applicationKeys.portfolio(id),
    queryFn: () => getApplicationPortfolio(id),
    enabled: !!id,
  });
}

export function useDecideApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ application, decision }: {
      application: PhotographerApplication;
      decision: ApplicationDecision;
    }) => decideApplication(application, decision),
    onSuccess: (updated) => {
      qc.setQueryData<PhotographerApplication[]>(applicationKeys.all, (current) =>
        current?.map((application) =>
          application.id === updated.id ? updated : application,
        ),
      );
      qc.invalidateQueries({ queryKey: queueKey });
    },
  });
}
