# CLAUDE.md — apps/landing

> Read the root `CLAUDE.md` first. This file only adds landing-specific notes.

**Role:** public marketing site + authentication. Dev port **5173**.

**Scope (what lives here):**
- Marketing landing page (hero, featured photographers showcase, sections).
- Auth: login / signup. **Login → role redirect** to the other apps.
- **Browse photographers + profile do NOT live here** — they're public routes in the **portal** app. Landing's discovery CTAs (`portalBrowse()` in `src/lib/links.ts`) link out to `VITE_PORTAL_URL/photographers`. Landing keeps a small photographer mock only for the homepage "featured" showcase.

**Auth (UI phase, mock backend):**
- `/login` and `/signup` are full pages under `AuthLayout` (no navbar, no modal). "Trở thành nhiếp ảnh gia" CTAs link to `/signup?role=photographer`.
- Login has NO role picker: `POST /api/auth/login` (MSW, accounts in `src/mock/users.ts`) returns the account's role, then `portalHomeFor()` (`src/lib/links.ts`) redirects to the portal browse page `/` (client) or `/dashboard` (photographer) with `#role=` — or back to a portal `?redirect=` URL (same-origin only).
- Admins do NOT sign in here (the public login rejects them like a wrong password); the admin app has its own `/login`.
- URLs come from `.env` (dev defaults to localhost:5174 / 5175).

**Router & errors:** a data router (`createBrowserRouter`, one splat route around `<App/>`, `errorElement` = `components/RouteError.tsx` → `ErrorScreen` from `@lens/ui`). `main.tsx` reloads a page restored from the back/forward cache, and `lib/api.ts` rejects HTML responses — see the portal CLAUDE.md for why (MSW unregisters when the tab leaves).

**Motion:** this is the bold one (§7/§7b of root) — hero has the lazy Three.js particle accent, GSAP parallax, animate-text headline, Lenis smooth scroll, magnetic CTAs, React Bits effects. Keep heavy effects code-split (deep `@lens/ui/...` imports in lazy sections). The photographer grid stays clean.

**Data:** landing's own `types/services/queries/msw/mock` (public photographers). Services call HTTP (axios); MSW (`src/msw/`) mocks `/api/*` from `src/mock/`. Mock seed imported ONLY by `src/msw/handlers.ts`. See root §4b for the layers + the `VITE_API_MOCKING` toggle.
