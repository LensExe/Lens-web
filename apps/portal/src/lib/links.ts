import type { PortalRole } from "@/types";

// Authentication lives in this app. `redirect` is accepted only when it points
// back to the portal origin, preventing the auth pages from becoming an open
// redirect.
export const PORTAL_URL = window.location.origin;
export const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

function safePortalRedirect(redirect: string | null): string | null {
  if (!redirect) return null;
  try {
    const url = new URL(redirect);
    return url.origin === new URL(PORTAL_URL).origin
      ? url.origin + url.pathname + url.search
      : null;
  } catch {
    return null;
  }
}

export function portalLogin(returnTo: string = window.location.href): string {
  const target = new URL("/login", PORTAL_URL);
  const redirect = safePortalRedirect(returnTo);
  if (redirect) target.searchParams.set("redirect", redirect);
  return target.toString();
}

export function portalSignup(returnTo: string = window.location.href): string {
  const target = new URL("/signup", PORTAL_URL);
  const redirect = safePortalRedirect(returnTo);
  if (redirect) target.searchParams.set("redirect", redirect);
  return target.toString();
}

const PORTAL_HOME: Record<PortalRole, string> = {
  client: "/",
  photographer: "/dashboard",
};

export function portalHomeFor(role: PortalRole, redirect: string | null = null): string {
  return safePortalRedirect(redirect) ?? `${PORTAL_URL}${PORTAL_HOME[role]}`;
}
