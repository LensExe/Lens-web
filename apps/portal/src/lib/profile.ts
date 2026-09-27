import { z } from "zod";
import { phoneSchema } from "@/lib/booking";
import type { Gender, UserProfile } from "@/types";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ và tên"),
  // Optional, but must be a valid number when given.
  phone: z.union([z.literal(""), phoneSchema]),
  birthday: z.string(),
  gender: z.union([z.literal(""), z.enum(["male", "female", "other"])]),
  city: z.string(),
  addressDetail: z.string().trim().max(120, "Địa chỉ tối đa 120 ký tự"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const toProfileFormValues = (p: UserProfile): ProfileFormValues => ({
  name: p.name,
  phone: p.phone,
  birthday: p.birthday,
  gender: p.gender,
  city: p.city,
  addressDetail: p.addressDetail,
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const NOTIFICATION_OPTIONS: {
  key: keyof UserProfile["notifications"];
  label: string;
  hint: string;
}[] = [
  {
    key: "bookingUpdates",
    label: "Cập nhật lịch đặt",
    hint: "Khi lịch chụp được xác nhận, thay đổi hoặc cần thanh toán.",
  },
  { key: "messages", label: "Tin nhắn mới", hint: "Khi có người nhắn tin cho bạn." },
  {
    key: "promotions",
    label: "Ưu đãi & khuyến mãi",
    hint: "Mã giảm giá, chương trình hoàn xu từ Lens.",
  },
  {
    key: "emailDigest",
    label: "Email tổng hợp hằng tuần",
    hint: "Tóm tắt hoạt động và nhiếp ảnh gia mới nổi bật.",
  },
];
