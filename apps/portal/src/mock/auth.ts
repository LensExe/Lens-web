import { avatar } from "@lens/ui";
import type { AuthUser } from "@/types";

/** A stored auth row. Passwords are only used by the MSW mock backend. */
export type MockAuthAccount = AuthUser & { password: string; demo?: boolean };

// Demo accounts used by the portal auth screen. They intentionally match the
// identities already used by the client and photographer workspace mocks.
export const mockAuthAccounts: MockAuthAccount[] = [
  {
    id: "u-khachhang",
    name: "Trần Khách Hàng",
    email: "khachhang@lens.vn",
    avatar: avatar("client-av"),
    role: "client",
    password: "demo1234",
    demo: true,
  },
  {
    id: "me",
    name: "Lý Gia Hân",
    email: "nhiepanhgia@lens.vn",
    avatar: avatar("giahan-av"),
    role: "photographer",
    password: "demo1234",
    demo: true,
  },
];
