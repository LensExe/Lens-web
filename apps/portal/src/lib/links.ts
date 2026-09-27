// Cross-app links. Sign-in / sign-up live in the landing app (another origin),
// so these are full URLs. `redirect` brings the user back here after login —
// the landing only accepts portal URLs for it.
export const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

export function landingLogin(returnTo: string = window.location.href): string {
  return `${LANDING_URL}/login?redirect=${encodeURIComponent(returnTo)}`;
}

export function landingSignup(returnTo: string = window.location.href): string {
  return `${LANDING_URL}/signup?redirect=${encodeURIComponent(returnTo)}`;
}
