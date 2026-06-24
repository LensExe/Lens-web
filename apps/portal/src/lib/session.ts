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

// UI phase — no real auth yet. The landing login redirects here with `?role=`,
// which we persist so the portal shows the matching demo account. LATER
// (Phase 2): replace with the authenticated session from Supabase.
const STORAGE_KEY = "lens.session.role";

type PortalRole = "client" | "photographer";

// One demo identity per role the portal can sign in as. Emails match the
// credentials autofilled on the landing login form.
const DEMO_USERS: Record<PortalRole, SessionUser> = {
  client: {
    name: "Trần Khách Hàng",
    email: "khachhang@lens.vn",
    avatar: avatar("client-av"),
    initials: "KH",
    role: "client",
  },
  photographer: {
    name: "Lý Gia Hân",
    email: "nhiepanhgia@lens.vn",
    avatar: avatar("giahan-av"),
    initials: "GH",
    role: "photographer",
  },
};

const DEFAULT_ROLE: PortalRole = "photographer";

const isPortalRole = (v: unknown): v is PortalRole =>
  v === "client" || v === "photographer";

// localStorage can throw (private mode / blocked storage). Never let that crash
// the app — fall back to in-memory defaults if it's unavailable.
function safeGetRole(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function safeSetRole(role: PortalRole) {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    /* storage blocked — role still applies for this page load */
  }
}

// Read `#role=` from the URL hash (set by the landing login redirect). The hash
// never reaches the server, so it's a clean handoff channel between origins.
function readRoleFromHash(): PortalRole | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const role = new URLSearchParams(hash).get("role");
  return isPortalRole(role) ? role : null;
}

// Resolve the signed-in role for this page load:
// 1) #role= from the landing login redirect → persist + strip it from the URL
// 2) previously persisted role (so a reload keeps you signed in)
// 3) default
function resolveRole(): PortalRole {
  const fromHash = readRoleFromHash();
  if (fromHash) {
    safeSetRole(fromHash);
    // Strip the hash from the address bar so refreshes stay clean.
    try {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + window.location.search
      );
    } catch {
      /* ignore */
    }
    return fromHash;
  }
  const saved = safeGetRole();
  return isPortalRole(saved) ? saved : DEFAULT_ROLE;
}

export const currentUser: SessionUser = DEMO_USERS[resolveRole()];

/** Clear the signed-in session — called by "Đăng xuất" before going to landing. */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

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
