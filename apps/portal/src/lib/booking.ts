import { z } from "zod";
import type {
  Booking,
  BookingStatus,
  PackageTerms,
  PaymentMethod,
  Photographer,
  PhotographerPackage,
} from "@/types";

/** VN label + subtle tinted pill style per booking status. */
export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  awaiting_deposit: {
    label: "Chờ đặt cọc",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  },
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

export interface SessionPackage
  extends Omit<PhotographerPackage, "price"> {
  /** Multiplier applied to the photographer's base price per session. */
  multiplier: number;
}

// Default tiers for photographers who haven't set up their own packages.
export const SESSION_PACKAGES: SessionPackage[] = [
  {
    id: "basic",
    name: "Gói cơ bản",
    description: "Buổi chụp gọn nhẹ, phù hợp chân dung cá nhân.",
    multiplier: 1,
    photoCount: 15,
    durationHours: 1,
    deliveryDays: 5,
  },
  {
    id: "standard",
    name: "Gói tiêu chuẩn",
    description: "Đủ thời gian đổi 2 bộ trang phục và bối cảnh.",
    multiplier: 1.8,
    photoCount: 35,
    durationHours: 2,
    deliveryDays: 7,
  },
  {
    id: "premium",
    name: "Gói cao cấp",
    description: "Nửa ngày chụp, nhiều bối cảnh, kèm album in.",
    multiplier: 3,
    photoCount: 70,
    durationHours: 4,
    deliveryDays: 10,
  },
];

const formatHours = (h: number) => `${String(h).replace(".", ",")} giờ`;

/** "15 ảnh · 2 giờ · giao trong 7 ngày" */
export function packageSummary(
  p: Pick<PhotographerPackage, "photoCount" | "durationHours" | "deliveryDays">
): string {
  return `${p.photoCount} ảnh · ${formatHours(p.durationHours)} · giao trong ${p.deliveryDays} ngày`;
}

export const packageTerms = (p: PhotographerPackage): PackageTerms => ({
  name: p.name,
  photoCount: p.photoCount,
  durationHours: p.durationHours,
  deliveryDays: p.deliveryDays,
});

/**
 * Upgrade a package saved before the structured fields existed (it only had a
 * free-text `duration` like "2 giờ chụp · 35 ảnh"): keep the text as the
 * description and read the numbers out of it where possible.
 */
export function normalizePackage(
  raw: Partial<PhotographerPackage> & { duration?: string; id: string; name: string; price: number }
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
    deliveryDays: raw.deliveryDays ?? 7,
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
  photoCount: num("Nhập số ảnh").int("Số ảnh phải là số nguyên").min(1, "Ít nhất 1 ảnh").max(500, "Tối đa 500 ảnh"),
  durationHours: num("Nhập thời lượng").min(0.5, "Tối thiểu 0,5 giờ").max(12, "Tối đa 12 giờ"),
  deliveryDays: num("Nhập số ngày").int("Số ngày phải là số nguyên").min(1, "Ít nhất 1 ngày").max(60, "Tối đa 60 ngày"),
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

// Time slots grouped by part of day (feedback R1: 22% khó đặt lịch — thêm lựa
// chọn khung giờ sáng/chiều/tối).
export const TIME_PERIODS: TimePeriod[] = [
  { id: "morning", label: "Buổi sáng", slots: ["08:00", "10:00"] },
  { id: "afternoon", label: "Buổi chiều", slots: ["14:00", "16:00"] },
  { id: "evening", label: "Buổi tối", slots: ["18:00", "20:00"] },
];

export const TIME_SLOTS = TIME_PERIODS.flatMap((p) => p.slots);

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
    description: t.description,
    price: packagePrice(base, t.id),
    photoCount: t.photoCount,
    durationHours: t.durationHours,
    deliveryDays: t.deliveryDays,
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

// ── Deposit (đặt cọc) ────────────────────────────────────────────────────────
// Business rules pending team sign-off — kept as constants so they're easy to
// change: 30% deposit, slot held for 30 minutes, deposit refunded in full if the
// photographer declines (or the client cancels before the shoot).
export const DEPOSIT_RATE = 0.3;
export const DEPOSIT_HOLD_MINUTES = 30;

/** Deposit for a given price, rounded to a clean 1k VND. */
export function depositAmount(price: number): number {
  return Math.round((price * DEPOSIT_RATE) / 1_000) * 1_000;
}

/** What's left to pay after the deposit. */
export function remainingAmount(b: Pick<Booking, "price" | "depositAmount">): number {
  return b.price - b.depositAmount;
}

// ── Cancellation policy ─────────────────────────────────────────────────────
// • Before the photographer accepts → the deposit comes back in full.
// • After accepting, ≥ FREE_CANCEL_DAYS before the shoot → everything paid back.
// • After accepting, closer than that → the deposit is forfeited (it goes to the
//   photographer, net of the platform fee, for holding the date); any remainder
//   already paid and any Lens Xu used come back.
// • A photographer declining always refunds in full (handled separately).
export const FREE_CANCEL_DAYS = 7;

const CANCELLABLE: BookingStatus[] = ["awaiting_deposit", "pending", "confirmed", "held"];
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
  b: Pick<Booking, "status" | "price" | "depositAmount" | "coinsRedeemed" | "date">
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
        : { refund: cashPaid - b.depositAmount, forfeit: b.depositAmount, coinsBack: coins, free: false };
    }
    default:
      // awaiting_deposit: nothing paid yet.
      return { refund: 0, forfeit: 0, coinsBack: 0, free: true };
  }
}

/** Cash returned to the client if they cancel now. */
export const refundAmount = (
  b: Pick<Booking, "status" | "price" | "depositAmount" | "coinsRedeemed" | "date">
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

/** The platform's receiving account shown for bank transfers (UI phase: sample). */
export const PLATFORM_BANK_ACCOUNT = {
  bank: "Vietcombank",
  number: "1023 4567 89",
  holder: "CONG TY TNHH LENS VIET NAM",
};

/** Transfer memo that ties a payment to its booking. */
export const transferMemo = (bookingId: string) =>
  `LENS ${bookingId.replace(/^bk-/, "").toUpperCase()}`;

/** VN label per mock payment method. */
export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "bank", label: "Chuyển khoản ngân hàng", hint: "Quét mã QR hoặc chuyển khoản thủ công" },
  { id: "card", label: "Thẻ tín dụng / ghi nợ", hint: "Visa, Mastercard, JCB" },
  { id: "momo", label: "Ví MoMo", hint: "Thanh toán qua ứng dụng MoMo" },
];

/** Vietnamese mobile number: 0xxxxxxxxx or +84xxxxxxxxx. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{8,10}$/, "Số điện thoại không hợp lệ");

export const bookingSchema = z.object({
  packageId: z.string().min(1, "Vui lòng chọn gói chụp"),
  date: z.string().min(1, "Vui lòng chọn ngày chụp"),
  timeSlot: z.string().min(1, "Vui lòng chọn khung giờ"),
  city: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  addressDetail: z.string().trim().max(120, "Địa chỉ tối đa 120 ký tự").optional(),
  contactName: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  contactPhone: phoneSchema,
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
