import { z } from "zod";
import type {
  BookingStatus,
  PaymentMethod,
  Photographer,
  PhotographerPackage,
} from "@/types";

/** VN label + subtle tinted pill style per booking status. */
export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  confirmed: {
    label: "Chờ thanh toán",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  held: {
    label: "Sàn đang giữ tiền",
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

export interface SessionPackage {
  id: string;
  name: string;
  duration: string;
  /** Multiplier applied to the photographer's base price per session. */
  multiplier: number;
}

export const SESSION_PACKAGES: SessionPackage[] = [
  { id: "basic", name: "Gói cơ bản", duration: "1 giờ chụp", multiplier: 1 },
  { id: "standard", name: "Gói tiêu chuẩn", duration: "2 giờ chụp", multiplier: 1.8 },
  { id: "premium", name: "Gói cao cấp", duration: "Nửa ngày (4 giờ)", multiplier: 3 },
];

export interface TimePeriod {
  id: string;
  label: string;
  slots: string[];
}

// Time slots grouped by part of day (feedback R1: 22% khó đặt lịch — thêm lựa
// chọn khung giờ sáng/chiều/tối).
export const TIME_PERIODS: TimePeriod[] = [
  { id: "morning", label: "Buổi sáng", slots: ["08:00", "10:00"] },
  { id: "afternoon", label: "Buổi chiều", slots: ["14:00", "16:00"] },
  { id: "evening", label: "Buổi tối", slots: ["18:00", "20:00"] },
];

export const TIME_SLOTS = TIME_PERIODS.flatMap((p) => p.slots);

// Deterministic "already booked" slots per photographer + date, so the UI can
// show realistic availability (lịch trống) without a backend. ~1/3 are taken.
export function isSlotTaken(
  photographerId: string,
  dateISO: string,
  slot: string
): boolean {
  if (!dateISO) return false;
  const s = `${photographerId}|${dateISO}|${slot}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 3 === 0;
}

/** Number of free slots in a part-of-day on a given date. */
export function freeInPeriod(
  photographerId: string,
  dateISO: string,
  period: TimePeriod
): number {
  if (!dateISO) return period.slots.length;
  return period.slots.filter((s) => !isSlotTaken(photographerId, dateISO, s)).length;
}

/** Total free slots on a date (across all periods). */
export function freeSlotCount(photographerId: string, dateISO: string): number {
  if (!dateISO) return TIME_SLOTS.length;
  return TIME_SLOTS.filter((s) => !isSlotTaken(photographerId, dateISO, s)).length;
}

/** A date is "nearly full" when 3 or fewer of its 6 slots remain — flagged on
 *  the calendar so the "sắp kín" state is actually visible on a meaningful share
 *  of days (≤2 almost never triggered). */
export function isDateNearlyFull(photographerId: string, dateISO: string): boolean {
  return freeSlotCount(photographerId, dateISO) <= 3;
}

// Price for a package. Rounded to a clean 10k VND — fine enough that the basic
// package (×1) always equals the photographer's listed price (which is a
// multiple of 10k), instead of jumping to the nearest 100k.
export function packagePrice(base: number, packageId: string): number {
  const pkg = SESSION_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return base;
  return Math.round((base * pkg.multiplier) / 10_000) * 10_000;
}

/** Default packages derived from a base price, for photographers who haven't
 *  set up their own yet. */
export function defaultPackages(base: number): PhotographerPackage[] {
  return SESSION_PACKAGES.map((t) => ({
    id: t.id,
    name: t.name,
    duration: t.duration,
    price: packagePrice(base, t.id),
  }));
}

/** The packages a photographer offers — their own if configured, else defaults. */
export function resolvePackages(
  p: Pick<Photographer, "packages" | "pricePerSession">
): PhotographerPackage[] {
  return p.packages && p.packages.length > 0
    ? p.packages
    : defaultPackages(p.pricePerSession);
}

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

/** VN label per mock payment method. */
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "bank", label: "Chuyển khoản ngân hàng", hint: "Quét mã QR hoặc chuyển khoản thủ công" },
  { id: "card", label: "Thẻ tín dụng / ghi nợ", hint: "Visa, Mastercard, JCB" },
  { id: "momo", label: "Ví MoMo", hint: "Thanh toán qua ứng dụng MoMo" },
];

export const bookingSchema = z.object({
  packageId: z.string().min(1, "Vui lòng chọn gói chụp"),
  date: z.string().min(1, "Vui lòng chọn ngày chụp"),
  timeSlot: z.string().min(1, "Vui lòng chọn khung giờ"),
  city: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  addressDetail: z.string().trim().max(120, "Địa chỉ tối đa 120 ký tự").optional(),
  contactName: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  contactPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)\d{8,10}$/, "Số điện thoại không hợp lệ"),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
