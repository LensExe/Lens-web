import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type { AdminBooking, AdminBookingsReport, EscrowStatus } from "@/types";

export const getAdminBookingDetail = adminApi.getBookingDetail;
export const getAdminBookingTimeline = adminApi.getBookingTimeline;

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
  let rawBookings = await allPages((query) => adminApi.listBookings(query));
  const hasListProjection = rawBookings.every((raw) =>
    Object.prototype.hasOwnProperty.call(record(raw), "paid_amount"),
  );

  // Keep the admin screen compatible while the backend is being deployed.
  // Once the list projection is available, this branch makes no auxiliary API
  // calls; older servers temporarily retain the previous enrichment flow.
  if (!hasListProjection && rawBookings.length > 0) {
    const [rawPhotographers, rawCustomers, rawUsers, rawPayments] = await Promise.all([
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
    const paidByBooking = new Map<string, number>();
    for (const raw of rawPayments) {
      const payment = record(raw);
      if (payment.status !== "paid") continue;
      const id = text(payment.reference_id);
      paidByBooking.set(id, (paidByBooking.get(id) ?? 0) + number(payment.amount));
    }
    const planById = new Map<string, string>();
    await Promise.all([...photographers.values()].map(async (photographer) => {
      const id = text(photographer.id);
      const plans = await adminApi.listPhotographerBookingPlans(id).catch(() => ({ items: [] }));
      for (const raw of plans.items) {
        const plan = record(raw);
        planById.set(text(plan.id), text(plan.name, "Buổi chụp"));
      }
    }));

    rawBookings = rawBookings.map((raw) => {
      const booking = record(raw);
      const photographer = photographers.get(text(booking.photographer_id));
      const photographerUser = users.get(text(photographer?.user_id));
      const customer = customers.get(text(booking.customer_id));
      const customerUser = users.get(text(customer?.user_id));
      return {
        ...booking,
        paid_amount: paidByBooking.get(text(booking.id)) ?? 0,
        photographer: photographerUser
          ? { fullname: photographerUser.fullname, avatar_url: photographerUser.avatar_url }
          : undefined,
        customer: customerUser
          ? { fullname: customerUser.fullname, avatar_url: customerUser.avatar_url }
          : undefined,
        booking_plan: { name: planById.get(text(booking.booking_plan_id)) },
      };
    });
  }

  const rows: AdminBooking[] = rawBookings.map((raw) => {
    const booking = record(raw);
    const photographer = record(booking.photographer);
    const customer = record(booking.customer);
    const packageSnapshot = record(booking.package_snapshot);
    const plan = record(booking.booking_plan);
    const paidAmount = number(booking.paid_amount);
    const status = mapStatus(
      booking.status,
      paidAmount >= number(booking.deposit_amount),
      paidAmount >= number(booking.total_amount),
    );
    return {
      id: text(booking.id),
      clientName: text(customer?.fullname, "Khách hàng"),
      clientAvatar: text(customer?.avatar_url) || undefined,
      photographerName: text(photographer.fullname, "Nhiếp ảnh gia"),
      photographerAvatar: text(photographer.avatar_url) || undefined,
      style: text(packageSnapshot.name || plan.name, "Buổi chụp"),
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
    return sum + number(booking.paid_amount);
  }, 0);
  return {
    summary: { escrowHeld, activeCount: active.length },
    rows,
  };
}
