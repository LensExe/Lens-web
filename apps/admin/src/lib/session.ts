import { avatar } from "@lens/ui";
import { logoutBackendSession } from "@/lib/backend-api";
import type { AdminSession } from "@/types";

const COOKIE_KEY = "lens.admin.session";
const STORAGE_KEY = "lens.admin.session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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

function writeSessionCookie(session: AdminSession): void {
  if (typeof document === "undefined") return;
  let value = encodeURIComponent(JSON.stringify(session));
  if (value.length > 3_500) {
    value = encodeURIComponent(JSON.stringify({ ...session, avatar: avatar(session.id) }));
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

function normalizeSession(value: unknown): AdminSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<AdminSession>;
  if (typeof session.id !== "string" || typeof session.name !== "string" ||
      typeof session.email !== "string") return null;
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    avatar: typeof session.avatar === "string" && session.avatar
      ? session.avatar
      : avatar(session.id),
  };
}

function getAdminSession(): AdminSession | null {
  const stored = cookieValue(COOKIE_KEY);
  if (stored) {
    try {
      const session = normalizeSession(JSON.parse(stored));
      if (session) return session;
    } catch {
      removeSessionCookie();
    }
  }

  let legacy: AdminSession | null;
  try {
    legacy = normalizeSession(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    legacy = null;
  } finally {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Storage may be blocked. */
    }
  }
  if (legacy) writeSessionCookie(legacy);
  return legacy;
}

export function saveAdminSession(session: AdminSession): void {
  writeSessionCookie(session);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be blocked. */
  }
}

export async function clearAdminSession(): Promise<void> {
  removeSessionCookie();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Ignore storage cleanup errors. */
  }
  await logoutBackendSession();
}

if (typeof window !== "undefined") {
  window.addEventListener("lens:auth-session-expired", removeSessionCookie);
}

export { getAdminSession };
