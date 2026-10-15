import { bookingApi, bookingPlanApi, paymentApi, photographerApi } from "@/services/backend";
import type { ApiBooking } from "@/types/bookings";
import type { ApiPayment } from "@/types/payments";
import type { ApiBookingPlan } from "@/types/booking-plans";
import type { ApiPhotographer } from "@/types/photographers";
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

interface BookingEnrichmentCache {
  photographers: Map<string, Promise<ApiPhotographer | null>>;
  plans: Map<string, Promise<ApiBookingPlan[]>>;
  paidAmounts: Map<string, Promise<number>>;
}

function createBookingEnrichmentCache(): BookingEnrichmentCache {
  return {
    photographers: new Map(),
    plans: new Map(),
    paidAmounts: new Map(),
  };
}

async function getPlan(
  photographerId: string,
  bookingPlanId: string,
  cache?: BookingEnrichmentCache,
): Promise<ApiBookingPlan | undefined> {
  let plans = cache?.plans.get(photographerId);
  if (!plans) {
    plans = bookingPlanApi.listPhotographerBookingPlans(photographerId).then((response) => response.items);
    cache?.plans.set(photographerId, plans);
  }
  return (await plans).find((plan) => plan.id === bookingPlanId);
}

function getPhotographer(photographerId: string, cache: BookingEnrichmentCache) {
  let photographer = cache.photographers.get(photographerId);
  if (!photographer) {
    photographer = photographerApi.getPhotographer(photographerId).catch(() => null);
    cache.photographers.set(photographerId, photographer);
  }
  return photographer;
}

async function loadPaidAmount(bookingId: string) {
  const history = await paymentApi.getBookingPayments(bookingId);
  return history.items.reduce((sum, payment) => {
    const row = payment as ApiObject;
    return row.status === "paid" || row.status === "completed" || row.status === "succeeded"
      ? sum + num(row.amount)
      : sum;
  }, 0);
}

async function getPaidAmount(bookingId: string, cache?: BookingEnrichmentCache) {
  let amount = cache?.paidAmounts.get(bookingId);
  if (!amount) {
    amount = loadPaidAmount(bookingId);
    cache?.paidAmounts.set(bookingId, amount);
  }
  return amount;
}

async function mapBooking(
  row: ApiBooking,
  cache: BookingEnrichmentCache = createBookingEnrichmentCache(),
): Promise<Booking> {
  const nested = row as ApiBooking & {
    customer?: unknown;
    photographer?: unknown;
    booking_plan?: unknown;
  };
  const snapshot = asRecord((row as ApiObject).package_snapshot);
  const bookingPhotographer = asRecord(nested.photographer);
  const bookingPlan = asRecord(nested.booking_plan);
  const embeddedPaidAmount = (row as ApiObject).paid_amount;
  const hasPaidAmount = embeddedPaidAmount !== undefined && embeddedPaidAmount !== null;
  const photographerRequest = str(bookingPhotographer.fullname)
    ? Promise.resolve(null)
    : getPhotographer(row.photographer_id, cache);
  const planRequest = str(snapshot.name) || str(bookingPlan.name)
    ? Promise.resolve(undefined)
    : getPlan(row.photographer_id, row.booking_plan_id, cache).catch(() => undefined);
  const paidAmountRequest = hasPaidAmount
    ? Promise.resolve(num(embeddedPaidAmount))
    : getPaidAmount(row.id, cache);
  const [photographer, plan, paidAmount] = await Promise.all([
    photographerRequest,
    planRequest,
    paidAmountRequest,
  ]);
  const paidDeposit = paidAmount >= row.deposit_amount;
  const paidTotal = paidAmount >= row.total_amount;
  const start = new Date(row.from);
  const end = new Date(row.to);
  const startParts = vietnamDateTimeParts(row.from);
  const snapshotName = str(snapshot.name);
  const packageDetails = snapshotName ? snapshot : bookingPlan;
  const packageName = str(packageDetails.name);
  const packageSnapshot = packageName
    ? {
        name: packageName,
        photoCount: num(
          packageDetails.photo_count,
          num(
            packageDetails.retouched_photo_count,
            plan?.photo_count ?? plan?.retouched_photo_count ?? 1,
          ),
        ),
        durationHours: num(packageDetails.duration_minutes, plan?.duration_minutes ?? 120) / 60,
        deliveryDays:
          typeof packageDetails.delivery_days === "number"
            ? packageDetails.delivery_days
            : plan?.delivery_days ?? undefined,
      }
    : plan
      ? {
          name: plan.name,
          photoCount: plan.photo_count,
          durationHours: plan.duration_minutes / 60,
          deliveryDays: plan.delivery_days ?? undefined,
        }
      : undefined;
  const customer = asRecord(nested.customer);
  const photographerName = str(
    bookingPhotographer.fullname || photographer?.fullname,
    "Nhiếp ảnh gia",
  );
  const photographerStyles = Array.isArray(bookingPhotographer.styles)
    ? bookingPhotographer.styles
    : photographer?.styles ?? [];
  return {
    id: row.id,
    clientId: row.customer_id ?? "",
    clientName: str(
      customer.fullname,
      sessionUser?.role === "client" ? sessionUser.name : "Khách hàng",
    ),
    photographerId: row.photographer_id,
    photographerName,
    style: photographerStyles.map((style) => STYLE_LABELS[str(style)]).find(Boolean) ?? "",
    date: startParts?.date ?? row.from.slice(0, 10),
    location: row.location,
    price: row.total_amount,
    status: mapStatus(row.status, paidDeposit, paidTotal),
    backendStatus: row.status,
    galleryPublishedAt: str((row as ApiObject).gallery_published_at) || null,
    galleryPhotoCount: num((row as ApiObject).gallery_photo_count),
    paidAmount,
    packageId: row.booking_plan_id,
    packageSnapshot,
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
  const cache = createBookingEnrichmentCache();
  const first = await bookingApi.listMyBookings({ limit, offset: 0 });
  const extra = await Promise.all(
    Array.from(
      { length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) },
      (_, index) =>
        bookingApi.listMyBookings({ limit, offset: first.items.length + index * limit }),
    ),
  );
  return Promise.all(
    [first.items, ...extra.map((page) => page.items)]
      .flat()
      .map((row) => mapBooking(row, cache)),
  );
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
      photoCount: plan.photo_count,
      durationHours: plan.duration_minutes / 60,
      deliveryDays: plan.delivery_days ?? undefined,
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
