import { avatar } from "@lens/ui";
import type { AdminSession } from "@/types";

/** A stored admin account row (DB seed). `password` never leaves the mock backend. */
export type MockAdminAccount = AdminSession & { password: string; demo?: boolean };

// Admin accounts (DB seed). Imported ONLY by src/msw/handlers.ts. UI phase:
// the demo account is listed on the login page so testers can sign in.
export const mockAdminAccounts: MockAdminAccount[] = [
  {
    id: "admin-1",
    name: "Admin Lens",
    email: "admin@lens.vn",
    avatar: avatar("admin-av"),
    password: "demo1234",
    demo: true,
  },
];
