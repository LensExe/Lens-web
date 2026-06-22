import { delay } from "@lens/ui";
import { mockActivity, mockStats } from "@/mock/stats";
import type { ActivityItem, OverviewStats } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API.
export async function getOverviewStats(): Promise<OverviewStats> {
  await delay();
  return mockStats;
  // LATER: return (await api.get<OverviewStats>("/admin/stats")).data;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  await delay();
  return mockActivity;
  // LATER: return (await api.get<ActivityItem[]>("/admin/activity")).data;
}
