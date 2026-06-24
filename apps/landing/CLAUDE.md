# CLAUDE.md — apps/landing

> Read the root `CLAUDE.md` first. This file only adds landing-specific notes.

**Role:** public marketing site + authentication. Dev port **5173**.

**Scope (what lives here):**
- Marketing landing page (hero, featured photographers showcase, sections).
- Auth: login / signup. **Login → role redirect** to the other apps.
- **Browse photographers + profile do NOT live here** — they're public routes in the **portal** app. Landing's discovery CTAs (`portalBrowse()` in `src/lib/links.ts`) link out to `VITE_PORTAL_URL/photographers`. Landing keeps a small photographer mock only for the homepage "featured" showcase.

**Auth redirect (UI phase, no real backend):**
- The login screen (`src/routes/Login.tsx`) lets the user pick a role, then redirects:
  - client / photographer → `VITE_PORTAL_URL` (portal)
  - admin → `VITE_ADMIN_URL` (admin)
- URLs come from `.env` (dev defaults to localhost:5174 / 5175).

**Motion:** this is the bold one (§7/§7b of root) — hero has the lazy Three.js particle accent, GSAP parallax, animate-text headline, Lenis smooth scroll, magnetic CTAs, React Bits effects. Keep heavy effects code-split (deep `@lens/ui/...` imports in lazy sections). The photographer grid stays clean.

**Data:** landing's own `types/services/queries/msw/mock` (public photographers). Services call HTTP (axios); MSW (`src/msw/`) mocks `/api/*` from `src/mock/`. Mock seed imported ONLY by `src/msw/handlers.ts`. See root §4b for the layers + the `VITE_API_MOCKING` toggle.
