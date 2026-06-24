import { api } from "@/lib/api";
import type { ActivityItem, OverviewStats } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) answers these.

export async function getOverviewStats(): Promise<OverviewStats> {
  return (await api.get<OverviewStats>("/admin/stats")).data;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  return (await api.get<ActivityItem[]>("/admin/activity")).data;
}
