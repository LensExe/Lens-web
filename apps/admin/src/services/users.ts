import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type { AdminUser, UserStatus } from "@/types";

export async function getUsers(): Promise<AdminUser[]> {
  const [users, photographers, customers] = await Promise.all([
    allPages((query) => adminApi.listUsers(query)),
    allPages((query) => adminApi.listPhotographers(query)),
    allPages((query) => adminApi.listCustomers(query)),
  ]);
  const photographerByUser = new Map(photographers.map((raw) => {
    const row = record(raw);
    return [text(row.user_id), row] as const;
  }));
  const customerByUser = new Map(customers.map((raw) => {
    const row = record(raw);
    return [text(row.user_id), row] as const;
  }));
  return users.map((raw) => {
    const row = record(raw);
    const id = text(row.id);
    const profile = photographerByUser.get(id) ?? customerByUser.get(id);
    return {
      id,
      name: text(row.fullname, "Người dùng"),
      email: text(row.email),
      avatar: text(row.avatar_url),
      role: photographerByUser.has(id) ? "photographer" : "client",
      status: row.status === "suspended" || row.status === "banned" ? "suspended" : "active",
      city: text(profile?.location, "—"),
      joinedAt: text(row.created_at),
      bookingsCount: typeof profile?.total_bookings === "number" ? number(profile.total_bookings) : undefined,
    };
  });
}

export async function setUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
  const row = record(await adminApi.updateUserStatus(id, { status }));
  return {
    id: text(row.id, id),
    name: text(row.fullname, "Người dùng"),
    email: text(row.email),
    avatar: text(row.avatar_url),
    role: "client",
    status,
    city: text(row.location, "—"),
    joinedAt: text(row.created_at),
  };
}
