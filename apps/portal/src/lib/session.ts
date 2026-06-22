import { avatar } from "@lens/ui";
import type { UserRole } from "@/types";

export interface SessionUser {
  name: string;
  email: string;
  avatar: string;
  /** Initials shown when the avatar image fails to load. */
  initials: string;
  role: UserRole;
}

// UI phase — no real auth yet. The signed-in user is hard-coded here.
// Change `role` to "client" or "photographer" to preview the other view.
// LATER (Phase 2): replace with the authenticated session from Supabase.
export const currentUser: SessionUser = {
  name: "Lý Gia Hân",
  email: "giahan@example.com",
  avatar: avatar("giahan-av"),
  initials: "GH",
  role: "photographer",
};

/**
 * Whether the given role may access a nav item / route allowed for `allow`.
 * A photographer is ALSO a customer, so photographers see everything clients
 * see (the client area) plus their own photographer area. Clients see only the
 * client area. So the client area lists ["client","photographer"], the
 * photographer area only ["photographer"], and Messages both.
 */
export function hasRole(allow: UserRole[], role: UserRole = currentUser.role) {
  return allow.includes(role);
}
