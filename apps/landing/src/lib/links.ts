// Cross-app links. Browse/profile now live in the portal app, so the landing
// links out to it (full navigation, different app/origin).
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

export function portalLogin(): string {
  return `${PORTAL_URL}/login`;
}

export function portalSignup(role?: "client" | "photographer"): string {
  const target = new URL("/signup", PORTAL_URL);
  if (role) target.searchParams.set("role", role);
  return target.toString();
}

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
