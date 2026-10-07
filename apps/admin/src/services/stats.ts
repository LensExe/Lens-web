import { adminApi } from "@/services/backend";

/** Current aggregate dashboard metrics returned by GET /admin/dashboard. */
export const getOverviewStats = adminApi.getDashboard;
