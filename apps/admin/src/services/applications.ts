import { delay } from "@lens/ui";
import { mockApplications } from "@/mock/applications";
import type { ApprovalStatus, PhotographerApplication } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API. In-memory store (UI phase) so approve/reject
// decisions persist within the session; a full reload resets them.
let store: PhotographerApplication[] = mockApplications.map((a) => ({ ...a }));

export async function getApplications(): Promise<PhotographerApplication[]> {
  await delay();
  // Pending first (these need action), then by most recent submission.
  return [...store].sort((a, b) => {
    const ap = a.status === "pending";
    const bp = b.status === "pending";
    if (ap !== bp) return ap ? -1 : 1;
    return b.submittedAt.localeCompare(a.submittedAt);
  });
  // LATER: return (await api.get<PhotographerApplication[]>("/admin/applications")).data;
}

export async function setApplicationStatus(
  id: string,
  status: ApprovalStatus
): Promise<PhotographerApplication> {
  await delay();
  store = store.map((a) => (a.id === id ? { ...a, status } : a));
  const updated = store.find((a) => a.id === id);
  if (!updated) throw new Error("Không tìm thấy hồ sơ");
  return updated;
  // LATER: return (await api.patch<PhotographerApplication>(`/admin/applications/${id}`, { status })).data;
}
