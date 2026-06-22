# CLAUDE.md — packages/ui (@lens/ui)

> Read the root `CLAUDE.md` first. This file only adds shared-package notes.

**Role:** the SHARED DESIGN SYSTEM, consumed by all 3 apps. **Design only — no data, no business logic, no routes.**

**Contains:**
- `components/ui/` — shadcn primitives (run `npx shadcn add` FROM THIS PACKAGE; config in `components.json`).
- `components/effects/` — React Bits effects.
- `components/theme/` — ThemeProvider, ThemeToggle.
- `hooks/` — generic motion/UI hooks (useReveal, useSmoothScroll, usePrefersReducedMotion, useIsMobile).
- `lib/` — `cn`, `delay`, `formatPrice`.
- `styles/globals.css` — Tailwind import + Awesomic design tokens + keyframes.
- `index.ts` — public barrel.

**Rules:**
- **Internal imports are relative** (`../../lib/utils`), never `@/` — apps own the `@/` alias.
- **Export new things from `index.ts`** so apps can `import { X } from "@lens/ui"`. Default-export effects are re-exported as named.
- **Do NOT add app data here** (types/services/queries/mock). Those belong in each app.
- Keep components tree-shakeable (named/default exports, `sideEffects: ["**/*.css"]`). Heavy effects are imported by apps via deep paths (`@lens/ui/components/effects/X`) when used in lazy sections.
- Apps consume this package as **source** (aliased in each app's vite/tsconfig), so React Compiler + Tailwind process it per app.
