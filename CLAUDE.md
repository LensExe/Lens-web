# CLAUDE.md — Lens (Photographer Marketplace · Monorepo)

> Claude Code reads this file at the start of every session. This is the project's constitution. Follow it. When a prompt conflicts with this file, this file wins. Each app also has its own `CLAUDE.md` with app-specific notes — read the one for the app you're working in.

---

## 1. What this project is
**Lens** — a web platform connecting people who want photos taken with photographers (a two-sided marketplace).
**Current phase: UI ONLY (frontend).** No backend, no auth, no payments yet. All data comes from mock files inside each app's `src/mock/`. Never call a real API in this phase.

## 2. Architecture — pnpm monorepo (3 apps + 1 shared package)
The project is a **pnpm-workspaces monorepo** orchestrated by **Turborepo**. There are **3 independent Vite apps** that build and deploy separately, plus **one shared design-system package**.

```
lens/
├─ pnpm-workspace.yaml            # workspaces: apps/*, packages/* + dependency CATALOG
├─ turbo.json                     # task pipeline (dev/build/lint)
├─ package.json                   # root: orchestrator scripts + lint tooling only
├─ DESIGN.md                      # design system spec (shared, at root)
├─ CLAUDE.md                      # this file
├─ packages/
│  └─ ui/                         # @lens/ui — SHARED DESIGN SYSTEM ONLY
│     ├─ components.json          # shadcn config (add primitives here)
│     └─ src/
│        ├─ components/ui/        # shadcn primitives
│        ├─ components/effects/   # React Bits effects (ClickSpark, Stack…)
│        ├─ components/theme/     # ThemeProvider, ThemeToggle
│        ├─ hooks/                # useReveal, useSmoothScroll, useIsMobile…
│        ├─ lib/                  # cn (utils), delay, formatPrice
│        ├─ styles/globals.css    # Tailwind + Awesomic tokens + keyframes
│        └─ index.ts              # barrel: import { Button } from "@lens/ui"
└─ apps/
   ├─ landing/   # 🌐 marketing + auth        (dev port 5173)
   ├─ portal/    # 👤 client + photographer   (dev port 5174)
   └─ admin/     # 🛡️ admin                    (dev port 5175)
```

Each app has the same internal shape:
```
apps/<app>/
├─ index.html  vite.config.ts  tsconfig.json  package.json  .env  CLAUDE.md
└─ src/
   ├─ main.tsx  App.tsx  index.css      # index.css imports @lens/ui globals
   ├─ routes/        # pages (VIEW layer)
   ├─ components/     # app-specific components (layout, sections)
   ├─ types/          # app domain types
   ├─ services/       # API functions (Layer 3) — currently return mock
   ├─ queries/        # TanStack Query hooks (Layer 2)
   ├─ mock/           # mock data (imported ONLY by services)
   ├─ stores/         # Zustand (UI state only)
   └─ lib/api.ts      # axios instance (this app's base URL)
```

### 2a. Shared vs per-app — THE key rule
- **`@lens/ui` holds ONLY the design system**: UI primitives, effects, theme, generic motion hooks, `cn`/`delay`/`formatPrice`, and the global CSS/design tokens. **No data, no business logic, no app routes.**
- **Everything about DATA lives inside each app**: `types`, `services` (API), `queries`, `mock`, `stores`. Each app owns its endpoints/types — do NOT push them into `@lens/ui`.
- Apps consume the design system via the barrel: `import { Button, ThemeToggle, useReveal, cn } from "@lens/ui"`.
- **Code-splitting matters:** heavy effects used only in lazy-loaded sections must be imported from the **deep path** (`import Masonry from "@lens/ui/components/effects/Masonry"`), NOT the barrel — otherwise the bundler pulls them into the initial chunk. Light/eager usage can use the barrel.

### 2b. Dependencies (strict pnpm + catalog)
- Standard pnpm (isolated/strict node_modules — **no** `.npmrc` hoisting). Each package declares ONLY the deps it actually imports; `@lens/ui` declares the design-system runtime deps (motion, gsap, radix-ui, …), each app declares its own (react, router, query, …) plus `"@lens/ui": "workspace:*"`.
- **Versions live once in the `catalog:` block of `pnpm-workspace.yaml`.** Packages reference them as `"react": "catalog:"` — never pin a version in an app/package directly. Bump a version in the catalog and it applies everywhere.
- **Adding a dependency:** `pnpm --filter <app> add <pkg>` (or `--filter @lens/ui`). Add the version to the catalog and use `catalog:` for consistency. Unused libs are intentionally NOT installed yet (zod, react-hook-form, zustand, date-fns…) — add them to the app that needs them when you build that feature.

### 2c. Commands
```bash
pnpm install          # once, sets up the whole workspace
pnpm dev              # turbo: run ALL 3 apps in parallel (5173/5174/5175)
pnpm dev:landing      # run a single app (also dev:portal / dev:admin)
pnpm build            # turbo: build all 3 → apps/<app>/dist (only changed rebuild)
pnpm build:landing    # build a single app
```
Use `pnpm --filter <app> <cmd>` for anything app-scoped. Turbo only rebuilds apps whose files (or `@lens/ui`) changed.

## 3. Language rule
**ALL user-facing text MUST be in Vietnamese.** Buttons, labels, headings, placeholders, error messages — Vietnamese. Code, variable names, comments, and commit messages are in English.

## 4. Tech stack (do not deviate)
- **Build:** Vite + React (v19) + TypeScript, one Vite app per `apps/*`. **NOT Next.js.** Plain React SPAs.
- **Monorepo:** pnpm workspaces + Turborepo. Package manager is **pnpm** only.
- **React Compiler:** enabled (stable v1.0) in every app's vite config. Auto-memoization at build time — DO NOT hand-write `useMemo`/`useCallback`/`memo()` unless the compiler genuinely can't handle a case. Write idiomatic React; follow the Rules of React strictly. Opt a component out locally with the `"use no memo"` directive if needed — never disable the compiler globally. (Vendored React Bits components in `@lens/ui` may violate these rules; the compiler bails out of them gracefully.)
- **Routing:** React Router (react-router-dom), declared in each app's `App.tsx`.
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`). Design tokens live in `@lens/ui/styles/globals.css`; follow `DESIGN.md`. Each app's `index.css` imports the shared globals and adds `@source "../../../packages/ui/src"` so Tailwind scans shared components.
- **Base components:** shadcn/ui — ALL primitives come from `@lens/ui` (generated into `packages/ui`). Run the shadcn CLI from `packages/ui`. Never mix another library for the same primitive.
- **State management:** Zustand, per app, UI/client state only. Server data = TanStack Query, never Zustand.
- **Forms & validation:** react-hook-form + zod, with Vietnamese error messages.
- **Icons:** lucide-react.
- **Dates:** date-fns.
- **Data fetching:** TanStack Query + axios, from day one (3-layer architecture below). Service layer returns mock now; axios wired but not calling a real backend yet.

## 4b. Data architecture — STRICT 3-layer separation (per app)
Data flows through three layers **inside each app**. Never skip or merge them. This lets us swap mock → real API by editing ONLY the service layer later.

```
View (component) → Query layer (TanStack hooks) → Service layer (API functions) → mock
```
- **Layer 1 — View** (`src/routes`, `src/components`): only renders UI and calls query hooks. No fetch, no axios, no mock imports, no data transformation.
- **Layer 2 — Query hooks** (`src/queries/`): the ONLY layer the View talks to. Wraps `useQuery`/`useMutation`, defines query keys/caching.
- **Layer 3 — Service** (`src/services/`): the actual data functions. **NOW:** import from `src/mock/`, `await delay()` (from `@lens/ui`), return mock. **LATER:** replace the mock return with a real axios call — keep both lines side by side so the swap is one edit. Example:
```ts
export async function getPhotographers() {
  await delay();                 // fake latency
  return mockPhotographers;      // CURRENT: mock
  // LATER: return (await api.get('/photographers')).data;
}
```
`mock/` is imported ONLY by `services/`, nowhere else.

## 5. Roles, apps & auth redirect
- **Landing** — public marketing homepage + **auth** only. On login, check role and redirect to the right app via env URLs (`VITE_PORTAL_URL`, `VITE_ADMIN_URL`). UI phase has no real auth — the login screen picks a role and redirects. Landing's browse/discovery CTAs link out to the portal.
- **Portal** — has TWO zones:
  - **Public (no login):** browse photographers (`/photographers`) + photographer profile (`/photographers/:id`) under `PublicLayout`. This is the discovery surface (landing links here).
  - **Signed-in app:** Client (`/client/*`) and Photographer (`/dashboard/*`) + `/messages` under `PortalLayout` (sidebar).
- **Admin** — approve photographers, manage users, monitor bookings, reports.

> Note: browse/profile live in **portal** (as public routes), not landing. Landing keeps a small photographer mock only for the homepage "featured" showcase; portal owns the full browse data + filters.

## 6. Hard rules (never break)
- **Shared vs per-app (§2a):** `@lens/ui` = design system only. Data (types/services/queries/mock/stores) lives in each app.
- **Data layering:** Views NEVER touch data directly. View → query hook → service → mock. Components must not import mock, axios, or fetch.
- **Mock only in the service layer.** `src/mock/` imported ONLY by `src/services/`.
- **One source per primitive:** every button/input/dialog comes from `@lens/ui` (shadcn). Don't duplicate primitives.
- **One animation per effect:** animate a given element with ONE library only.
- **Code-split heavy effects** via deep `@lens/ui/...` imports in lazy sections (§2a).
- **No secrets in code.** No API keys, tokens, or credentials anywhere. Env files hold only public URLs.
- One component per file, clearly named. Prefer small, readable components.

## 7. Secondary UI libraries & motion (live in `@lens/ui`)
- **React Bits** (reactbits.dev): animated components — installed per-component via shadcn CLI into `packages/ui/src/components/effects/`. Currently bundled: ClickSpark, LogoLoop, Masonry, RotatingText, ScrollFloat, ScrollReveal, ScrollVelocity, Stack, TiltedCard, CountUp, Magnet.
- **GSAP** (`gsap` + `@gsap/react`): scroll motion via `useGSAP` + ScrollTrigger with cleanup (`useReveal` hook in `@lens/ui`). Register only ScrollTrigger.
- **Three.js** (`three` + `@react-three/fiber`): ONE subtle 3D accent in the landing hero only. **Lazy-loaded + desktop-only** (skip on mobile / coarse pointer / prefers-reduced-motion); paused offscreen/tab-hidden. Keep poly/particle counts low.
- **Lenis**: smooth scroll (`useSmoothScroll` in `@lens/ui`), wheel only, disabled under reduced-motion, native touch on mobile.
- **animate-text skill**: per-character headline reveal (soft-blur-in) on the landing hero.

### 7b. Motion & performance direction
This is a PHOTO marketplace — photographers' images are the star, not UI effects.
- **Landing → strong motion** (hero 3D + parallax + animated headline). The one place to be bold.
- **Photographer grid → clean.** Subtle hover only. Let photos breathe.
- **Dashboards (portal/admin) → minimal motion.** Fast, clear, data-first.
- **Performance is non-negotiable:** animate transform/opacity only; lazy-load + code-split anything heavy (3D, motion-based effects); respect `prefers-reduced-motion`; keep the initial JS lean. A fast plain page beats a laggy fancy one.

## 8. Build order (per app; finish a block before moving on)
**landing:** 1) shell + design system wiring → 2) landing page → 3) auth screens.
**portal:** public browse photographers ✓ → photographer profile → booking flow → client dashboard → photographer dashboard → messaging.
**admin:** dashboard → approve photographers → users → reports (use ReUI Data Grid for data-heavy tables).
When I say "tiếp" / "next", continue with the next sensible block.

## 9. How to work with me (Karpathy-inspired)
1. **Think before coding.** Don't assume — ask or state assumptions, surface tradeoffs, push back if there's a simpler way. Stop and ask when confused.
2. **Simplicity first.** Minimum code that solves the task. No speculative features or abstractions.
3. **Surgical changes.** Touch only what the task needs. Match existing style. Mention unrelated dead code; don't delete it unprompted.
4. **Goal-driven.** For non-trivial tasks, give a brief plan with verification checks, let me review, then execute. Plan before each build block. Always follow `DESIGN.md` + shadcn for consistency.

## 10. Deployment
Each app deploys **independently** (its own `dist/`), to any host (Vercel / VPS / cloud — mix freely). Apps talk only via URLs in env vars. One repo → per-app CI: `git push` rebuilds only the apps that changed. Keep builds portable (standard Vite output). Config files (`vercel.json` / GitHub Actions / nginx) to be added when we actually deploy.

## 11. Testing
No test setup in the UI phase (correctness judged visually). Add **Vitest** in Phase 2 when there's real logic (booking rules, payments).

## 12. Phase 2 (NOT now — noted for context)
Backend: **Supabase** (auth for 3 roles + Postgres + Storage). Going live = edit ONLY each app's `src/services/*` to replace mock returns with real axios calls. Add role-based route protection. Photographer `approval_status` gate: new photographers are `pending` and hidden from public until an admin approves. Payments: integrate a gateway later.
