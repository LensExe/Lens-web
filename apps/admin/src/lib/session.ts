import type { AdminSession } from "@/types";
import { setBackendTokens } from "@/lib/backend-api";

// UI phase — no real auth yet. The admin signs in on this app's own `/login`
// (never through the public landing) and the session is kept in localStorage.
// LATER (Phase 2): replace with the authenticated Supabase session + role check.
const STORAGE_KEY = "lens.admin.session";

// localStorage can throw (private mode / blocked storage) — never crash on it.
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? JSON.parse(raw) as AdminSession : null;
    return value && typeof value.accessToken === "string" && value.accessToken ? value : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  setBackendTokens(session.accessToken && session.refreshToken
    ? { accessToken: session.accessToken, refreshToken: session.refreshToken }
    : null);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage blocked — the session won't survive a reload */
  }
}

export function clearAdminSession() {
  setBackendTokens(null);
}
