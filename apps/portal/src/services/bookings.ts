import { bookingApi, bookingPlanApi, paymentApi, photographerApi } from "@/services/backend";
import type { ApiBooking } from "@/types/bookings";
import type { ApiPayment } from "@/types/payments";
import type { ApiBookingPlan } from "@/types/booking-plans";
import type { ApiObject } from "@/types/common";
import { sessionUser } from "@/lib/session";
import { toVietnamIso, vietnamDateTimeParts } from "@/lib/vietnam-time";
import type { Booking, BookingInput, DepositInput, PaymentInput } from "@/types";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};
const STYLE_LABELS: Record<string, Booking["style"]> = {
  portrait: "Chân dung",
  vintage: "Đường phố",
  korean: "Chân dung",
  wedding: "Cưới",
  concept: "Thời trang",
  "pre-wedding": "Cưới",
  beach: "Du lịch",
  lifestyle: "Gia đình",
  event: "Sự kiện",
  corporate: "Sản phẩm",
  family: "Gia đình",
  outdoor: "Du lịch",
  kids: "Gia đình",
  streetwear: "Đường phố",
  fashion: "Thời trang",
  film: "Đường phố",
  maternity: "Gia đình",
  commercial: "Sản phẩm",
};

function idempotencyKey() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function toDateTime(date: string, time: string) {
  return toVietnamIso(date, time);
}

function mapStatus(
  status: ApiBooking["status"],
  paidDeposit = false,
  paidTotal = false,
): Booking["status"] {
  switch (status) {
    case "pending":
      // A booking is created as pending. Until the deposit is paid it stays
      // in the customer's deposit step; once paid, the same backend pending
      // row is waiting for the photographer's confirmation.
      return paidDeposit ? "pending" : "awaiting_deposit";
    case "accepted":
      return paidTotal ? "held" : paidDeposit ? "confirmed" : "awaiting_deposit";
    case "in_progress":
    case "shot":
      return "held";
    case "completed":
      return "released";
    case "rejected":
    case "cancelled":
    case "expired":
      return "cancelled";
  }
}

export interface BookingPaymentAttempt {
  booking: Booking;
  payment: ApiPayment;
}

export const getPaymentStatus = (paymentId: string) => paymentApi.getPayment(paymentId);
export const getPaymentQr = (paymentId: string) => paymentApi.getPaymentQr(paymentId);

async function getPlan(
  photographerId: string,
  bookingPlanId: string,
): Promise<ApiBookingPlan | undefined> {
  const response = await bookingPlanApi.listPhotographerBookingPlans(photographerId);
  return response.items.find((plan) => plan.id === bookingPlanId);
}

async function getPaidAmounts(bookingId: string) {
  const history = await paymentApi.getBookingPayments(bookingId);
  return history.items.reduce((sum, payment) => {
    const row = payment as ApiObject;
    return row.status === "paid" || row.status === "completed" || row.status === "succeeded"
      ? sum + num(row.amount)
      : sum;
  }, 0);
}

async function mapBooking(row: ApiBooking): Promise<Booking> {
  const [photographer, plan, paidAmount] = await Promise.all([
    photographerApi.getPhotographer(row.photographer_id).catch(() => null),
    getPlan(row.photographer_id, row.booking_plan_id).catch(() => undefined),
    getPaidAmounts(row.id),
  ]);
  const paidDeposit = paidAmount >= row.deposit_amount;
  const paidTotal = paidAmount >= row.total_amount;
  const start = new Date(row.from);
  const end = new Date(row.to);
  const startParts = vietnamDateTimeParts(row.from);
  const nested = row as ApiBooking & {
    customer?: unknown;
    photographer?: unknown;
    booking_plan?: unknown;
  };
  const customer = asRecord(nested.customer);
  const bookingPhotographer = asRecord(nested.photographer);
  const photographerName = str(
    photographer?.fullname || bookingPhotographer.fullname,
    "Nhiếp ảnh gia",
  );
  return {
    id: row.id,
    clientId: row.customer_id ?? "",
    clientName: str(
      customer.fullname,
      sessionUser?.role === "client" ? sessionUser.name : "Khách hàng",
    ),
    photographerId: row.photographer_id,
    photographerName,
    style: photographer?.styles?.map((style) => STYLE_LABELS[style]).find(Boolean) ?? "",
    date: startParts?.date ?? row.from.slice(0, 10),
    location: row.location,
    price: row.total_amount,
    status: mapStatus(row.status, paidDeposit, paidTotal),
    backendStatus: row.status,
    galleryPublishedAt: str((row as ApiObject).gallery_published_at) || null,
    paidAmount,
    packageId: row.booking_plan_id,
    packageSnapshot: plan
      ? {
          name: plan.name,
          photoCount: plan.retouched_photo_count,
          durationHours: plan.duration_minutes / 60,
        }
      : undefined,
    timeSlot: startParts?.time ?? start.toISOString().slice(11, 16),
    depositAmount: row.deposit_amount,
    depositPaidAt: paidDeposit ? str((row as ApiObject).deposit_paid_at) || undefined : undefined,
    contactPhone: "",
    note: "",
    collaborators: [],
    // Keep the date arithmetic referenced here to make malformed intervals obvious in API data.
    ...(end <= start ? { depositDeadline: undefined } : {}),
  };
}

export async function getMyBookings(): Promise<Booking[]> {
  const limit = 100;
  const first = await bookingApi.listMyBookings({ limit, offset: 0 });
  const extra = await Promise.all(
    Array.from(
      { length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) },
      (_, index) =>
        bookingApi.listMyBookings({ limit, offset: first.items.length + index * limit }),
    ),
  );
  return Promise.all([first.items, ...extra.map((page) => page.items)].flat().map(mapBooking));
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const plan = await getPlan(input.photographerId, input.packageId);
  if (!plan) throw new Error("Không tìm thấy gói chụp này trên backend.");
  const from = toDateTime(input.date, input.timeSlot);
  const start = new Date(from);
  const to = new Date(start.getTime() + plan.duration_minutes * 60_000).toISOString();
  const row = await bookingApi.createBooking({
    photographer_id: input.photographerId,
    booking_plan_id: input.packageId,
    location: input.location,
    from,
    to,
  });
  return {
    ...(await mapBooking(row)),
    photographerName: input.photographerName,
    style: input.style,
    packageId: input.packageId,
    packageSnapshot: {
      name: plan.name,
      photoCount: plan.retouched_photo_count,
      durationHours: plan.duration_minutes / 60,
    },
  };
}

export async function payBooking(
  bookingId: string,
  input: PaymentInput,
): Promise<BookingPaymentAttempt> {
  const payment = await paymentApi.createBookingRemainingPayment(bookingId, {
    idempotency_key: idempotencyKey(),
    payment_method: input.method,
  });
  const checkout =
    input.method === "gateway" ? await paymentApi.getPaymentQr(payment.id).catch(() => ({})) : {};
  return {
    booking: await mapBooking(await bookingApi.getBooking(bookingId)),
    payment: { ...payment, ...checkout } as ApiPayment,
  };
}

export async function confirmReceipt(bookingId: string): Promise<Booking> {
  return mapBooking(await bookingApi.confirmBookingReceipt(bookingId));
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  return mapBooking(
    await bookingApi.cancelBooking(bookingId, { reason: "Khách hàng yêu cầu hủy lịch." }),
  );
}

export async function payDeposit(
  bookingId: string,
  input: DepositInput,
): Promise<BookingPaymentAttempt> {
  const payment = await paymentApi.createBookingDepositPayment(bookingId, {
    idempotency_key: idempotencyKey(),
    payment_method: input.method,
  });
  const checkout =
    input.method === "gateway" ? await paymentApi.getPaymentQr(payment.id).catch(() => ({})) : {};
  return {
    booking: await mapBooking(await bookingApi.getBooking(bookingId)),
    payment: { ...payment, ...checkout } as ApiPayment,
  };
}
