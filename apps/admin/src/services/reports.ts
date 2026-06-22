import { delay } from "@lens/ui";
import { mockReports } from "@/mock/reports";
import type { ReportData } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API.
export async function getReports(): Promise<ReportData> {
  await delay();
  return mockReports;
  // LATER: return (await api.get<ReportData>("/admin/reports")).data;
}
