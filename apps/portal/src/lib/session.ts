import { avatar } from "@lens/ui";
import { getLegacyBackendSubject, logoutBackendSession } from "@/lib/backend-api";
import type { AuthUser, PortalRole, UserRole } from "@/types";

export interface SessionUser {
  id: string;
  keycloakId?: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role: PortalRole;
  emailVerified: boolean;
  accessTokenExpiresAt?: number;
}

const COOKIE_KEY = "lens.portal.session";
const LEGACY_STORAGE_KEY = "lens.session.v1";
const LEGACY_ROLE_KEY = "lens.session.role";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const isPortalRole = (value: unknown): value is PortalRole =>
  value === "client" || value === "photographer";

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function cookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return entry.slice(prefix.length);
  }
}

function normalizeSession(value: unknown): SessionUser | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<SessionUser>;
  if (!isPortalRole(session.role) || typeof session.id !== "string" ||
      typeof session.name !== "string" || typeof session.email !== "string") return null;
  return {
    id: session.id,
    ...(typeof session.keycloakId === "string" ? { keycloakId: session.keycloakId } : {}),
    name: session.name,
    email: session.email,
    avatar: typeof session.avatar === "string" && session.avatar
      ? session.avatar
      : avatar(session.id),
    initials: typeof session.initials === "string" && session.initials
      ? session.initials
      : getInitials(session.name),
    role: session.role,
    emailVerified: session.emailVerified === true,
    ...(typeof session.accessTokenExpiresAt === "number"
      ? { accessTokenExpiresAt: session.accessTokenExpiresAt }
      : {}),
  };
}

function writeSessionCookie(user: SessionUser): void {
  if (typeof document === "undefined") return;
  let value = encodeURIComponent(JSON.stringify(user));
  if (value.length > 3_500) {
    value = encodeURIComponent(JSON.stringify({ ...user, avatar: avatar(user.id) }));
  }
  if (value.length > 3_800) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_KEY}=${value}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; SameSite=Strict${secure}`;
}

function removeSessionCookie(): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Strict${secure}`;
}

function readLegacySession(): SessionUser | null {
  let legacy: SessionUser | null;
  try {
    legacy = normalizeSession(JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? "null"));
    if (legacy && !legacy.keycloakId) {
      legacy.keycloakId = getLegacyBackendSubject() ?? undefined;
    }
  } catch {
    legacy = null;
  } finally {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_ROLE_KEY);
    } catch {
      /* Storage may be blocked. */
    }
  }
  return legacy;
}

function readSession(): SessionUser | null {
  const stored = cookieValue(COOKIE_KEY);
  if (stored) {
    try {
      return normalizeSession(JSON.parse(stored));
    } catch {
      removeSessionCookie();
    }
  }
  const legacy = readLegacySession();
  if (legacy) writeSessionCookie(legacy);
  return legacy;
}

function safeSetSession(user: SessionUser): void {
  writeSessionCookie(user);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lens:session-updated"));
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {
    /* Storage may be blocked. */
  }
}

/** Signed-in profile metadata for UI rendering; backend authorization uses HttpOnly token cookies. */
export const sessionUser: SessionUser | null = readSession();
export const isSignedIn = sessionUser !== null;
export const currentUser = sessionUser as SessionUser;

export function saveSession(user: AuthUser, expiresIn?: number): void {
  const accessTokenExpiresAt = typeof expiresIn === "number" && expiresIn > 0
    ? Date.now() + expiresIn * 1_000
    : undefined;
  safeSetSession({
    ...user,
    initials: getInitials(user.name),
    emailVerified: user.emailVerified === true,
    ...(accessTokenExpiresAt ? { accessTokenExpiresAt } : {}),
  });
}

/** Persist a verification result returned by the authenticated email OTP endpoint. */
export function setCurrentUserEmailVerified(emailVerified: boolean): void {
  if (!sessionUser) return;
  sessionUser.emailVerified = emailVerified;
  safeSetSession(sessionUser);
}

export async function clearSession(): Promise<void> {
  removeSessionCookie();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lens:auth-session-expired"));
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {
    /* Ignore storage cleanup errors. */
  }
  await logoutBackendSession();
}

if (typeof window !== "undefined") {
  window.addEventListener("lens:backend-session-refreshed", (event) => {
    const expiresAt = (event as CustomEvent<{ expiresAt?: unknown }>).detail?.expiresAt;
    if (!sessionUser || typeof expiresAt !== "number") return;
    sessionUser.accessTokenExpiresAt = expiresAt;
    safeSetSession(sessionUser);
  });
  window.addEventListener("lens:auth-session-expired", removeSessionCookie);
}

export function hasRole(allow: UserRole[], role: UserRole | undefined = sessionUser?.role) {
  return !!role && allow.includes(role);
}

export function mapBackendRole(value: unknown): PortalRole | null {
  if (typeof value !== "string") return null;
  const role = value.trim().toLowerCase();
  if (role === "customer" || role === "client") return "client";
  if (role === "photographer") return "photographer";
  return null;
}
