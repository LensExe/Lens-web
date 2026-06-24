import { api } from "@/lib/api";
import type { AdminUser, UserStatus } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) owns the
// in-memory store + sorting and answers these in the UI phase.

export async function getUsers(): Promise<AdminUser[]> {
  return (await api.get<AdminUser[]>("/admin/users")).data;
}

export async function setUserStatus(
  id: string,
  status: UserStatus
): Promise<AdminUser> {
  return (await api.patch<AdminUser>(`/admin/users/${id}`, { status })).data;
}
