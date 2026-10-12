import { avatar } from "@lens/ui";
import {
  getCurrentEmailVerificationStatus,
  setBackendTokens,
} from "@/lib/backend-api";
import type { AuthUser, PortalRole, UserRole } from "@/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role: PortalRole;
  emailVerified: boolean;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = "lens.session.v1";
const LEGACY_ROLE_KEY = "lens.session.role";

const isPortalRole = (v: unknown): v is PortalRole =>
  v === "client" || v === "photographer";

function safeGetSession(): SessionUser | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<SessionUser> | null;
    return value && isPortalRole(value.role) && typeof value.id === "string"
      && typeof value.name === "string" && typeof value.email === "string"
      ? {
          id: value.id,
          name: value.name,
          email: value.email,
          avatar: typeof value.avatar === "string" && value.avatar ? value.avatar : avatar(value.id),
          initials: typeof value.initials === "string" ? value.initials : getInitials(value.name),
          role: value.role,
          emailVerified: typeof value.emailVerified === "boolean"
            ? value.emailVerified
            : getCurrentEmailVerificationStatus(),
        }
      : null;
  } catch {
    return null;
  }
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function safeSetSession(user: SessionUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {
    /* The current tab can still continue if storage is blocked. */
  }
}

/** The signed-in user, or `null` for a guest. */
export const sessionUser: SessionUser | null = safeGetSession();
export const isSignedIn = sessionUser !== null;
export const currentUser = sessionUser as SessionUser;

export function saveSession(user: AuthUser, tokens: SessionTokens) {
  setBackendTokens(tokens);
  safeSetSession({
    ...user,
    emailVerified: user.emailVerified ?? false,
    initials: getInitials(user.name),
  });
}

/** Persist a verification result returned by the authenticated email OTP endpoint. */
export function setCurrentUserEmailVerified(emailVerified: boolean) {
  if (!sessionUser) return;
  sessionUser.emailVerified = emailVerified;
  safeSetSession(sessionUser);
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
  } catch {
    /* ignore */
  }
  setBackendTokens(null);
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
