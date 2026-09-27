import { avatar } from "@lens/ui";
import type { UserRole } from "@/types";

export interface SessionUser {
  /** Stable id sent to the mock backend so data is scoped to this user. */
  id: string;
  name: string;
  email: string;
  avatar: string;
  /** Initials shown when the avatar image fails to load. */
  initials: string;
  role: UserRole;
}

// UI phase — no real auth yet. The landing login redirects here with `#role=`,
// which we persist so the portal shows the matching demo account. Without it the
// visitor is a GUEST (null): they can browse + view profiles, while booking,
// messaging and the signed-in app send them to the landing login.
// LATER (Phase 2): replace with the authenticated session from Supabase.
const STORAGE_KEY = "lens.session.role";

type PortalRole = "client" | "photographer";

// One demo identity per role the portal can sign in as. Emails match the
// credentials autofilled on the landing login form.
const DEMO_USERS: Record<PortalRole, SessionUser> = {
  client: {
    id: "u-khachhang",
    name: "Trần Khách Hàng",
    email: "khachhang@lens.vn",
    avatar: avatar("client-av"),
    initials: "KH",
    role: "client",
  },
  photographer: {
    // Matches her id in the photographer roster + dashboard (mock).
    id: "me",
    name: "Lý Gia Hân",
    email: "nhiepanhgia@lens.vn",
    avatar: avatar("giahan-av"),
    initials: "GH",
    role: "photographer",
  },
};

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
// 3) none → guest
function resolveRole(): PortalRole | null {
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
  return isPortalRole(saved) ? saved : null;
}

const role = resolveRole();

/** The signed-in user, or `null` for a guest. Public pages must use this. */
export const sessionUser: SessionUser | null = role ? DEMO_USERS[role] : null;

export const isSignedIn = sessionUser !== null;

/**
 * The signed-in user, for code that only runs inside `RequireAuth` (the
 * signed-in app, booking flow). Never read it on a public page — a guest has no
 * user there; use `sessionUser` instead.
 */
export const currentUser = sessionUser as SessionUser;

/** Clear the signed-in session — called by "Đăng xuất" before going to landing. */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Whether the given role may access a route / menu item allowed for `allow`.
 * Clients and photographers each have their OWN workspace (`/client/*` vs the
 * `/dashboard/*` studio); shared pages (messages, wallet, settings) allow both.
 */
export function hasRole(
  allow: UserRole[],
  role: UserRole | undefined = sessionUser?.role
) {
  return !!role && allow.includes(role);
}
