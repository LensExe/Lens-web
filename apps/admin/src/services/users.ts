import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type {
  AdminCustomerProfile,
  AdminUser,
  AdminUserAccountDetail,
  AdminUserBooking,
  UserStatus,
} from "@/types";

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

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
    const photographer = photographerByUser.get(id);
    const customer = customerByUser.get(id);
    const profile = photographer ?? customer;
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
      customerProfile: customer ? {
        id: text(customer.id),
        location: text(customer.location, "—"),
        description: text(customer.description),
        preferredStyles: strings(customer.preferred_styles),
      } : undefined,
      photographerProfile: photographer ? {
        id: text(photographer.id),
        location: text(photographer.location, "—"),
        description: text(photographer.description),
        styles: strings(photographer.styles),
        verificationStatus: text(photographer.verification_status, "unverified"),
        isAvailable: photographer.is_available === true,
        careerStartYear: typeof photographer.started_career_at === "number"
          ? number(photographer.started_career_at)
          : undefined,
        startingPrice: number(photographer.starting_price),
        portfolioCount: number(photographer.portfolio_count),
      } : undefined,
    };
  });
}

export async function getAdminUserAccount(id: string): Promise<AdminUserAccountDetail> {
  const row = record(await adminApi.getUser(id));
  return {
    phoneNumber: text(row.phone_number) || undefined,
    gender: text(row.gender) || undefined,
    dob: text(row.dob) || undefined,
  };
}

export async function getAdminCustomerProfile(id: string): Promise<AdminCustomerProfile> {
  const row = record(await adminApi.getCustomer(id));
  return {
    id,
    location: text(row.location, "—"),
    description: text(row.description),
    preferredStyles: strings(row.preferred_styles),
  };
}

export async function getAdminUserBookings(userId: string): Promise<AdminUserBooking[]> {
  const bookings = await allPages((query) => adminApi.listBookings({ ...query, user_id: userId }));
  return bookings.map((raw) => {
    const row = record(raw);
    const customer = record(row.customer);
    const photographer = record(row.photographer);
    const packageSnapshot = record(row.package_snapshot);
    const bookingPlan = record(row.booking_plan);
    const status = text(row.status, "pending") as AdminUserBooking["status"];
    return {
      id: text(row.id),
      customerName: text(customer.fullname, "Khách hàng"),
      customerAvatar: text(customer.avatar_url) || undefined,
      photographerName: text(photographer.fullname, "Nhiếp ảnh gia"),
      photographerAvatar: text(photographer.avatar_url) || undefined,
      style: text(packageSnapshot.name || bookingPlan.name, "Buổi chụp"),
      date: text(row.from),
      location: text(row.location, "—"),
      price: number(row.total_amount),
      paidAmount: number(row.paid_amount),
      status,
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
