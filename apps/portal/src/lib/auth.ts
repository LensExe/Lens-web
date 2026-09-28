import { z } from "zod";
import type { PortalRole } from "@/types";

export const ROLE_LABELS: Record<PortalRole, string> = {
  client: "Khách hàng",
  photographer: "Nhiếp ảnh gia",
};

export const isPortalRole = (v: unknown): v is PortalRole =>
  v === "client" || v === "photographer";

const email = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email")
  .pipe(z.email("Email không hợp lệ"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  role: z.enum(["client", "photographer"]),
  name: z.string().trim().min(2, "Vui lòng nhập họ và tên"),
  email,
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự"),
});

export type SignupValues = z.infer<typeof signupSchema>;
