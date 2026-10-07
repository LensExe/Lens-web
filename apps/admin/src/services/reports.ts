import { adminApi } from "@/services/backend";
import { allPages, record, text } from "@/services/normalize";

export interface AdminModerationReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export async function getReports(): Promise<AdminModerationReport[]> {
  const reports = await allPages((query) => adminApi.listReports(query));
  return reports.map((raw) => {
    const row = record(raw);
    return {
      id: text(row.id),
      targetType: text(row.target_type),
      targetId: text(row.target_id),
      reason: text(row.reason),
      status: text(row.status),
      createdAt: text(row.created_at),
    };
  });
}
