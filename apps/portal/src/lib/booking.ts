import { z } from "zod";
import type {
  Booking,
  BookingStatus,
  PackageTerms,
  Photographer,
  PhotographerPackage,
} from "@/types";

/** VN label + subtle tinted pill style per booking status. */
export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  awaiting_deposit: {
    label: "Chờ đặt cọc",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  },
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  confirmed: {
    label: "Đã đặt cọc",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  held: {
    label: "Đang thực hiện",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  released: {
    label: "Hoàn thành",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  cancelled: {
    label: "Đã huỷ",
    className: "bg-muted text-muted-foreground",
  },
};

const formatHours = (h: number) => `${String(h).replace(".", ",")} giờ`;

/** Summary based on fields the backend booking-plan API stores. */
export function packageSummary(
  p: Pick<PhotographerPackage, "photoCount" | "durationHours" | "deliveryDays">,
): string {
  return `${p.photoCount} ảnh · ${formatHours(p.durationHours)}${p.deliveryDays ? ` · giao trong ${p.deliveryDays} ngày` : ""}`;
}

export const packageTerms = (p: PhotographerPackage): PackageTerms => ({
  name: p.name,
  photoCount: p.photoCount,
  durationHours: p.durationHours,
  deliveryDays: p.deliveryDays,
});

/** Upgrade a legacy package with structured values when available. */
export function normalizePackage(
  raw: Partial<PhotographerPackage> & {
    duration?: string;
    id: string;
    name: string;
    price: number;
  },
): PhotographerPackage {
  const legacy = raw.duration ?? "";
  const photos = legacy.match(/(\d+)\s*ảnh/);
  const hours = legacy.match(/(\d+(?:[.,]\d+)?)\s*giờ/);
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    description: raw.description ?? legacy,
    photoCount: raw.photoCount ?? (photos ? Number(photos[1]) : 20),
    durationHours:
      raw.durationHours ??
      (hours ? Number(hours[1].replace(",", ".")) : /nửa ngày/i.test(legacy) ? 4 : 2),
    deliveryDays: raw.deliveryDays,
  };
}

/** Date the photos are due: shoot date + the package's delivery days. */
export function deliveryDeadline(dateISO: string, deliveryDays: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const due = new Date(y, m - 1, d + deliveryDays);
  return `${String(due.getDate()).padStart(2, "0")}/${String(due.getMonth() + 1).padStart(2, "0")}/${due.getFullYear()}`;
}

/**
 * Delivered photos vs. what the booked package promises. The client can only
 * confirm receipt once `complete` (the confirm-receipt handler checks the same).
 */
export function deliveryProgress(b: Pick<Booking, "packageSnapshot">, delivered: number) {
  const required = b.packageSnapshot?.photoCount ?? 1;
  return {
    required,
    delivered,
    missing: Math.max(0, required - delivered),
    complete: delivered >= required,
  };
}

// Editor validation (Gói dịch vụ) — Vietnamese messages.
const num = (msg: string) => z.number({ error: msg });
export const packageSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2, "Nhập tên gói"),
  description: z.string().trim().max(160, "Mô tả tối đa 160 ký tự"),
  price: num("Nhập giá").int("Giá phải là số nguyên").min(10_000, "Giá tối thiểu 10.000 ₫"),
  photoCount: num("Nhập số ảnh")
    .int("Số ảnh phải là số nguyên")
    .min(1, "Ít nhất 1 ảnh")
    .max(500, "Tối đa 500 ảnh"),
  durationHours: num("Nhập thời lượng").min(0.5, "Tối thiểu 0,5 giờ").max(12, "Tối đa 12 giờ"),
});
export const packagesFormSchema = z.object({
  packages: z.array(packageSchema).min(1, "Cần ít nhất một gói dịch vụ"),
});
export type PackagesFormValues = z.infer<typeof packagesFormSchema>;

export interface TimePeriod {
  id: string;
  label: string;
  slots: string[];
}

const halfHourSlots = (from: number, to: number) =>
  Array.from({ length: (to - from) / 30 }, (_, i) => {
    const minutes = from + i * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  });

/** Public booking window inside one day: start at 07:00, finish by midnight. */
export const BOOKING_START_MINUTES = 7 * 60;
export const BOOKING_END_MINUTES = 24 * 60;

// Google Calendar-style precision: clients can start a booking every 30
// minutes, while the package duration determines how much time is occupied.
export const TIME_SLOTS = halfHourSlots(BOOKING_START_MINUTES, BOOKING_END_MINUTES);

export const TIME_PERIODS: TimePeriod[] = [
  { id: "morning", label: "Buổi sáng", slots: halfHourSlots(BOOKING_START_MINUTES, 12 * 60) },
  { id: "afternoon", label: "Buổi chiều", slots: halfHourSlots(12 * 60, 18 * 60) },
  { id: "evening", label: "Buổi tối", slots: halfHourSlots(18 * 60, BOOKING_END_MINUTES) },
];

/** Only show booking plans returned by the backend. */
export function resolvePackages(
  p: Pick<Photographer, "packages" | "pricePerSession">,
): PhotographerPackage[] {
  return p.packages ?? [];
}

// ── Deposit (đặt cọc) ────────────────────────────────────────────────────────
// Business rules pending team sign-off — kept as constants so they're easy to
// change: 30% deposit, slot held for 30 minutes, deposit refunded in full if the
// photographer declines (or the client cancels before the shoot).
export const DEPOSIT_RATE = 0.3;
export const DEPOSIT_HOLD_MINUTES = 30;

/** Deposit for a given price, rounded to a clean 1k VND. */
export function depositAmount(price: number): number {
  return Math.ceil(price * DEPOSIT_RATE);
}

/** What's left to pay after the deposit. */
export function remainingAmount(b: Pick<Booking, "price" | "depositAmount">): number {
  return b.price - b.depositAmount;
}

/** The photographer marks a shoot as `shot` before the customer pays the balance. */
export function isPaymentDue(
  booking: Pick<Booking, "status" | "backendStatus" | "paidAmount" | "price">,
): boolean {
  return (
    booking.status === "held" &&
    booking.backendStatus === "shot" &&
    (booking.paidAmount ?? 0) < booking.price
  );
}

/** Remaining balance can be paid after the deposit and photographer confirmation, or once the shoot is marked `shot`. */
export function needsRemainingPayment(
  booking: Pick<Booking, "status" | "backendStatus" | "paidAmount" | "price">,
): boolean {
  return (
    (booking.status === "confirmed" || isPaymentDue(booking)) &&
    (booking.paidAmount ?? 0) < booking.price
  );
}

/** Status label shown to customers after the photographer marks the shoot as shot. */
export function bookingStatusMeta(
  booking: Pick<Booking, "status" | "backendStatus" | "paidAmount" | "price">,
): { label: string; className: string } {
  return isPaymentDue(booking)
    ? { label: "Chờ thanh toán", className: "bg-ember/10 text-ember" }
    : BOOKING_STATUS_META[booking.status];
}

// ── Cancellation policy ─────────────────────────────────────────────────────
// • Before the photographer accepts → the deposit comes back in full.
// • After accepting, ≥ FREE_CANCEL_DAYS before the shoot → everything paid back.
// • After accepting, closer than that → the deposit is forfeited (it goes to the
//   photographer, net of the platform fee, for holding the date); any remainder
//   already paid and any Lens Xu used come back.
// • A photographer declining always refunds in full (handled separately).
export const FREE_CANCEL_DAYS = 7;

const CANCELLABLE: BookingStatus[] = ["awaiting_deposit", "pending", "confirmed"];
export const canCancel = (b: Pick<Booking, "status">) => CANCELLABLE.includes(b.status);

/** Whole days from today until an ISO `yyyy-MM-dd` date (negative = past). */
export function daysUntil(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}

/** Last day a cancellation is free once the photographer has accepted. */
export function freeCancelDeadline(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const last = new Date(y, m - 1, d - FREE_CANCEL_DAYS);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export interface CancelTerms {
  /** Cash returned to the client's wallet. */
  refund: number;
  /** Deposit kept (paid to the photographer). */
  forfeit: number;
  /** Lens Xu returned. */
  coinsBack: number;
  /** Whether this cancellation is free of charge. */
  free: boolean;
}

/** What cancelling right now costs / returns (the mock backend applies the same). */
export function cancelTerms(
  b: Pick<Booking, "status" | "price" | "depositAmount" | "coinsRedeemed" | "date">,
): CancelTerms {
  const coins = b.coinsRedeemed ?? 0;
  const early = daysUntil(b.date) >= FREE_CANCEL_DAYS;
  switch (b.status) {
    case "pending":
      return { refund: b.depositAmount, forfeit: 0, coinsBack: 0, free: true };
    case "confirmed":
      return early
        ? { refund: b.depositAmount, forfeit: 0, coinsBack: 0, free: true }
        : { refund: 0, forfeit: b.depositAmount, coinsBack: 0, free: false };
    case "held": {
      const cashPaid = b.price - coins;
      return early
        ? { refund: cashPaid, forfeit: 0, coinsBack: coins, free: true }
        : {
            refund: cashPaid - b.depositAmount,
            forfeit: b.depositAmount,
            coinsBack: coins,
            free: false,
          };
    }
    default:
      // awaiting_deposit: nothing paid yet.
      return { refund: 0, forfeit: 0, coinsBack: 0, free: true };
  }
}

/** Cash returned to the client if they cancel now. */
export const refundAmount = (
  b: Pick<Booking, "status" | "price" | "depositAmount" | "coinsRedeemed" | "date">,
) => cancelTerms(b).refund;

/** Platform commission taken from the photographer's payout on release. */
export const COMMISSION_RATE = 0.1;

/** Platform fee for a booking, rounded to a clean 1k VND. */
export function commissionAmount(price: number): number {
  return Math.round((price * COMMISSION_RATE) / 1_000) * 1_000;
}

/** What the photographer actually receives after the platform fee. */
export function photographerPayout(price: number): number {
  return price - commissionAmount(price);
}

/** Vietnamese mobile number: 0xxxxxxxxx or +84xxxxxxxxx. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{8,10}$/, "Số điện thoại không hợp lệ");

export const bookingSchema = z.object({
  packageId: z.string().min(1, "Vui lòng chọn gói chụp"),
  date: z.string().min(1, "Vui lòng chọn ngày chụp"),
  timeSlot: z
    .string()
    .regex(/^(0[7-9]|1\d|2[0-3]):[03]0$/, "Chọn giờ bắt đầu từ 07:00 theo mỗi 30 phút"),
  city: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  addressDetail: z.string().trim().max(120, "Địa chỉ tối đa 120 ký tự").optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
