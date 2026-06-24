import { api } from "@/lib/api";
import type { ReportData } from "@/types";

// Layer 3 — Service / API. Thin HTTP call; the mock backend (src/msw) answers it.

export async function getReports(): Promise<ReportData> {
  return (await api.get<ReportData>("/admin/reports")).data;
}
