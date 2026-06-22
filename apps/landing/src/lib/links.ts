// Cross-app links. Browse/profile now live in the portal app, so the landing
// links out to it (full navigation, different app/origin).
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

export function portalBrowse(query?: string): string {
  const q = query?.trim();
  // Browse is the portal root ("/").
  return q ? `${PORTAL_URL}/?q=${encodeURIComponent(q)}` : `${PORTAL_URL}/`;
}

export function portalProfile(id: string): string {
  return `${PORTAL_URL}/photographers/${id}`;
}
