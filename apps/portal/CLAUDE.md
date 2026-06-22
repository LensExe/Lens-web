# CLAUDE.md — apps/portal

> Read the root `CLAUDE.md` first. This file only adds portal-specific notes.

**Role:** clients + photographers app, PLUS the public discovery pages. Dev port **5174**.

**Two zones / two layouts:**
- **Public (no login)** under `PublicLayout` (slim top bar with an **avatar account-menu**):
  - `/` — **default route = browse** photographers (search + filter, Block 3 ✓)
  - `/photographers/:id` — photographer profile (Block 4, todo)
  - The header **avatar Popover** (`PublicLayout`) is the entry point into the signed-in dashboards.
- **Signed-in app** under `PortalLayout` (sidebar + "Đăng xuất" → landing), reached via the avatar menu:
  - Client: `/client`, `/client/bookings`, `/client/reviews`
  - Photographer: `/dashboard`, `/dashboard/portfolio`, `/dashboard/availability`, `/dashboard/bookings`
  - Shared: `/messages`

**Motion:** minimal (work surface). Fast, clear, data-first. Gentle transitions only — no hero effects, no parallax.

**Data:** portal owns its own `types/services/queries/mock/stores` (bookings, profile, portfolio, messages). Do NOT import data from `@lens/ui` or other apps. Mock only in `services/`.

**Build order:** public browse ✓ → photographer profile → booking flow → client dashboard → photographer dashboard → messaging.
