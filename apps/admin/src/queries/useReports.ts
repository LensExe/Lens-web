import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReport,
  getReportContact,
  getReports,
  resolveReport,
  sendReportMessage,
} from "@/services/reports";
import type { ReportResolveDto } from "@/types/backend-api";

// Layer 2 — Query hooks.
export const reportKeys = {
  all: ["reports"] as const,
  detail: (id: string) => ["reports", id] as const,
  contact: (userId: string) => ["reports", "contact", userId] as const,
};

export function useReports() {
  return useQuery({
    queryKey: reportKeys.all,
    queryFn: getReports,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
    enabled: Boolean(id),
  });
}

export function useReportContact(userId: string) {
  return useQuery({
    queryKey: reportKeys.contact(userId),
    queryFn: () => getReportContact(userId),
    enabled: Boolean(userId),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReportResolveDto }) => resolveReport(id, body),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.all });
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(variables.id) });
    },
  });
}

export function useSendReportMessage() {
  return useMutation({ mutationFn: sendReportMessage });
}
