import { api } from "@/lib/api";
import type { StorageReport } from "@/types";

// Layer 3 — Service / API.
export async function getStorageReport(): Promise<StorageReport> {
  return (await api.get<StorageReport>("/admin/storage")).data;
}
