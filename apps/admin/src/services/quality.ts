import { api } from "@/lib/api";
import type { QualityReport } from "@/types";

// Layer 3 — Service / API.
export async function getQualityReport(): Promise<QualityReport> {
  return (await api.get<QualityReport>("/admin/quality")).data;
}
