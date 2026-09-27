import { avatar } from "@lens/ui";
import type { User } from "@/types";

/** A stored account row (DB seed). `password` never leaves the mock backend. */
export type MockAccount = User & { password: string; demo?: boolean };

const img = (seed: string) => avatar(seed);

// UI phase: every seeded account uses this password.
const DEMO_PASSWORD = "demo1234";

// Mock accounts across the three roles. Imported ONLY by src/msw/handlers.ts.
// `demo` accounts are listed on the login page so testers can sign in as each
// role — their ids/emails match the portal's demo users. The admin row exists
// to prove the public login rejects admins (they sign in on the admin app).
export const mockAccounts: MockAccount[] = [
  { id: "u-khachhang", name: "Trần Khách Hàng", avatar: img("client-av"), email: "khachhang@lens.vn", role: "client", city: "Hà Nội", password: DEMO_PASSWORD, demo: true },
  { id: "me", name: "Lý Gia Hân", avatar: img("giahan-av"), email: "nhiepanhgia@lens.vn", role: "photographer", city: "Hà Nội", password: DEMO_PASSWORD, demo: true },
  { id: "u2", name: "Trương Văn Phúc", avatar: img("vanphuc-av"), email: "vanphuc@example.com", role: "client", city: "TP. Hồ Chí Minh", password: DEMO_PASSWORD },
  { id: "u3", name: "Nguyễn Minh Anh", avatar: img("minhanh-av"), email: "minhanh@example.com", role: "photographer", city: "Hà Nội", password: DEMO_PASSWORD },
  { id: "u4", name: "Trần Quốc Bảo", avatar: img("quocbao-av"), email: "quocbao@example.com", role: "photographer", city: "TP. Hồ Chí Minh", password: DEMO_PASSWORD },
  { id: "u5", name: "Admin Lens", avatar: img("admin-av"), email: "admin@lens.vn", role: "admin", city: "Hà Nội", password: DEMO_PASSWORD },
];
