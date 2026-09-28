import { avatar } from "@lens/ui";
import type { AuthUser, PortalRole, UserRole } from "@/types";

export interface SessionUser {
  /** Stable id sent to the mock backend so data is scoped to this user. */
  id: string;
  name: string;
  email: string;
  avatar: string;
  /** Initials shown when the avatar image fails to load. */
  initials: string;
  role: PortalRole;
}

// UI phase — no real auth yet. Authentication now lives in this app. Without a
// saved session the visitor is a GUEST (null): they can browse + view profiles,
// while booking, messaging and the signed-in app send them to `/login`.
// LATER (Phase 2): replace with the authenticated session from Supabase.
const STORAGE_KEY = "lens.session.v1";
const LEGACY_ROLE_KEY = "lens.session.role";

// One demo identity per role the portal can sign in as.
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

function safeGetSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SessionUser>;
    return isPortalRole(value.role) && typeof value.id === "string" && typeof value.name === "string"
      && typeof value.email === "string" && typeof value.avatar === "string" && typeof value.initials === "string"
      ? (value as SessionUser)
      : null;
  } catch {
    return null;
  }
}

function safeGetLegacyRole(): string | null {
  try {
    return localStorage.getItem(LEGACY_ROLE_KEY);
  } catch {
    return null;
  }
}

function safeSetSession(user: SessionUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {
    /* storage blocked — the session won't survive a reload */
  }
}

// Read `#role=` from old landing-login links so existing open tabs can finish
// the handoff while the new portal auth flow is being adopted.
function readRoleFromHash(): PortalRole | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const role = new URLSearchParams(hash).get("role");
  return isPortalRole(role) ? role : null;
}

function resolveSession(): SessionUser | null {
  const fromHash = readRoleFromHash();
  if (fromHash) {
    const user = DEMO_USERS[fromHash];
    safeSetSession(user);
    try {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
    return user;
  }

  const saved = safeGetSession();
  if (saved) return saved;

  // Migrate sessions created by the previous landing-auth implementation.
  const legacyRole = safeGetLegacyRole();
  if (!isPortalRole(legacyRole)) return null;
  const user = DEMO_USERS[legacyRole];
  safeSetSession(user);
  return user;
}

/** The signed-in user, or `null` for a guest. Public pages must use this. */
export const sessionUser: SessionUser | null = resolveSession();

export const isSignedIn = sessionUser !== null;

/**
 * The signed-in user, for code that only runs inside `RequireAuth` (the
 * signed-in app, booking flow). Never read it on a public page — a guest has no
 * user there; use `sessionUser` instead.
 */
export const currentUser = sessionUser as SessionUser;

/** Persist a user returned by the portal auth endpoint. Callers reload after
 * this so module-level guards and API headers see the new session. */
export function saveSession(user: AuthUser) {
  safeSetSession({
    ...user,
    initials: user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
  });
}

/** Clear the signed-in session. */
export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
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
