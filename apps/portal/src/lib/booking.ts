import { z } from "zod";
import type { BookingStatus } from "@/types";

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
    label: "Đã xác nhận",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  completed: {
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

export const TIME_SLOTS = ["08:00", "10:00", "14:00", "16:00"];

/** Price for a package, rounded to a clean 100k VND. */
export function packagePrice(base: number, packageId: string): number {
  const pkg = SESSION_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return base;
  return Math.round((base * pkg.multiplier) / 100_000) * 100_000;
}

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
