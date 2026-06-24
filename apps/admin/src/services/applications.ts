import { api } from "@/lib/api";
import type { ApprovalStatus, PhotographerApplication } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) owns the
// in-memory store + sorting and answers these in the UI phase.

export async function getApplications(): Promise<PhotographerApplication[]> {
  return (await api.get<PhotographerApplication[]>("/admin/applications")).data;
}

export async function setApplicationStatus(
  id: string,
  status: ApprovalStatus
): Promise<PhotographerApplication> {
  return (
    await api.patch<PhotographerApplication>(`/admin/applications/${id}`, {
      status,
    })
  ).data;
}
