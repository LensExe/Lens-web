import type { PortalRole } from "@/types";

// Cross-app links. Browse/profile now live in the portal app, so the landing
// links out to it (full navigation, different app/origin).
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

export function portalBrowse(query?: string): string {
  const q = query?.trim();
  // Browse is the portal root ("/").
  return q ? `${PORTAL_URL}/?q=${encodeURIComponent(q)}` : `${PORTAL_URL}/`;
}

/** Browse pre-filtered to one photo style (the portal's `styles` filter). */
export function portalBrowseStyle(style: string): string {
  return `${PORTAL_URL}/?styles=${encodeURIComponent(style)}`;
}

export function portalProfile(id: string): string {
  return `${PORTAL_URL}/photographers/${id}`;
}

// Each role's landing page in the portal: clients come to find a photographer,
// so they land on browse; photographers land on their dashboard.
const PORTAL_HOME: Record<PortalRole, string> = {
  client: "/",
  photographer: "/dashboard",
};

// Only follow `?redirect=` back into the portal — anything else (another
// origin, a malformed URL) is ignored so the login can't be used as an open
// redirect.
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

/**
 * Where to send a user after sign-in: back to the portal page that asked them to
 * log in, else their role's home. The role rides in the URL hash (never sent to
 * a server); the portal reads it, persists it and strips it on arrival.
 */
export function portalHomeFor(role: PortalRole, redirect: string | null = null): string {
  const target = safePortalRedirect(redirect) ?? `${PORTAL_URL}${PORTAL_HOME[role]}`;
  return `${target}#role=${role}`;
}
