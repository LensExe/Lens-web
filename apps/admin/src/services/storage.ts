import { adminApi } from "@/services/backend";
import type { AdminStorageReportData } from "@/types/backend-api";

export async function getStorageReport(): Promise<AdminStorageReportData> {
  const limit = 100;
  const first = await adminApi.getStorageReport({ limit, offset: 0 });
  const pages = await Promise.all(
    Array.from(
      { length: Math.ceil(Math.max(0, first.total - first.rows.length) / limit) },
      (_, index) => adminApi.getStorageReport({ limit, offset: first.rows.length + index * limit }),
    ),
  );
  return { ...first, rows: [first.rows, ...pages.map((page) => page.rows)].flat() };
}
