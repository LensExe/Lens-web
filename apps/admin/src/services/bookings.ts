import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type { AdminBooking, AdminBookingsReport, EscrowStatus } from "@/types";

function mapStatus(status: unknown, paidDeposit: boolean, paidTotal: boolean): EscrowStatus {
  switch (status) {
    case "pending": return "pending";
    case "accepted": return paidTotal ? "held" : paidDeposit ? "confirmed" : "awaiting_deposit";
    case "in_progress":
    case "shot": return "held";
    case "completed": return "released";
    default: return "cancelled";
  }
}

export async function getBookings(): Promise<AdminBookingsReport> {
  const [rawBookings, rawPhotographers, rawCustomers, rawUsers, rawPayments] = await Promise.all([
    allPages((query) => adminApi.listBookings(query)),
    allPages((query) => adminApi.listPhotographers(query)),
    allPages((query) => adminApi.listCustomers(query)),
    allPages((query) => adminApi.listUsers(query)),
    allPages((query) => adminApi.listPayments(query)),
  ]);
  const users = new Map(rawUsers.map((raw) => {
    const row = record(raw);
    return [text(row.id), row] as const;
  }));
  const photographers = new Map(rawPhotographers.map((raw) => {
    const row = record(raw);
    return [text(row.id), row] as const;
  }));
  const customers = new Map(rawCustomers.map((raw) => {
    const row = record(raw);
    return [text(row.id), row] as const;
  }));
  const paidByBooking = new Map<string, { deposit: number; total: number }>();
  for (const raw of rawPayments) {
    const payment = record(raw);
    if (payment.status !== "paid") continue;
    const id = text(payment.reference_id);
    const amount = number(payment.amount);
    const total = paidByBooking.get(id) ?? { deposit: 0, total: 0 };
    if (payment.type === "deposit") total.deposit += amount;
    if (payment.type === "remaining") total.total += amount;
    paidByBooking.set(id, total);
  }
  const planById = new Map<string, string>();
  await Promise.all([...photographers.values()].map(async (photographer) => {
    const id = text(photographer.id);
    const plans = await adminApi.listPhotographerBookingPlans(id).catch(() => ({ items: [] }));
    for (const raw of plans.items) planById.set(text(record(raw).id), text(record(raw).name, "Buổi chụp"));
  }));

  const rows: AdminBooking[] = rawBookings.map((raw) => {
    const booking = record(raw);
    const photographer = photographers.get(text(booking.photographer_id));
    const photographerUser = users.get(text(photographer?.user_id));
    const customer = customers.get(text(booking.customer_id));
    const paid = paidByBooking.get(text(booking.id)) ?? { deposit: 0, total: 0 };
    const status = mapStatus(booking.status, paid.deposit >= number(booking.deposit_amount),
      paid.deposit + paid.total >= number(booking.total_amount));
    return {
      id: text(booking.id),
      clientName: text(customer?.fullname, "Khách hàng"),
      clientAvatar: text(customer?.avatar_url) || undefined,
      photographerName: text(photographerUser?.fullname, "Nhiếp ảnh gia"),
      photographerAvatar: text(photographerUser?.avatar_url) || undefined,
      style: planById.get(text(booking.booking_plan_id)) || "Buổi chụp",
      date: text(booking.from).slice(0, 10),
      price: number(booking.total_amount),
      status,
      collaborators: undefined,
    };
  });
  const active = rows.filter((booking) => !["released", "cancelled"].includes(booking.status));
  const escrowHeld = rawBookings.reduce((sum, raw) => {
    const booking = record(raw);
    const status = text(booking.status);
    if (!["accepted", "in_progress", "shot"].includes(status)) return sum;
    const paid = paidByBooking.get(text(booking.id));
    return sum + (paid?.deposit ?? 0) + (paid?.total ?? 0);
  }, 0);
  return {
    summary: { escrowHeld, activeCount: active.length },
    rows,
  };
}
