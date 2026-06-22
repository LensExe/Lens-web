import { delay } from "@lens/ui";
import { mockUsers } from "@/mock/users";
import type { AdminUser, UserStatus } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API. In-memory store (UI phase) so suspend/activate
// persists within the session; a full reload resets it.
let store: AdminUser[] = mockUsers.map((u) => ({ ...u }));

export async function getUsers(): Promise<AdminUser[]> {
  await delay();
  return [...store].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  // LATER: return (await api.get<AdminUser[]>("/admin/users")).data;
}

export async function setUserStatus(
  id: string,
  status: UserStatus
): Promise<AdminUser> {
  await delay();
  store = store.map((u) => (u.id === id ? { ...u, status } : u));
  const updated = store.find((u) => u.id === id);
  if (!updated) throw new Error("Không tìm thấy người dùng");
  return updated;
  // LATER: return (await api.patch<AdminUser>(`/admin/users/${id}`, { status })).data;
}
