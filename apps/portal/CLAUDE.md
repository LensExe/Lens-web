# CLAUDE.md — apps/portal

> Read the root `CLAUDE.md` first. This file only adds portal-specific notes.

**Role:** clients + photographers app, PLUS the public discovery pages. Dev port **5174**.

**Session (UI phase):** `src/lib/session.ts`. Login and register live in this app at `/login` and `/signup`; without a saved session the visitor is a **guest** (`sessionUser === null`). Public pages read `sessionUser`/`isSignedIn`; `currentUser` is only safe inside `RequireAuth`. Guests who try to book/message/open the app are sent to `/login?redirect=<this url>` (`src/lib/links.ts`).

**Zones / layouts:**
- **Public (guests welcome)** under `PublicLayout` — header shows "Đăng nhập / Đăng ký" for guests, the avatar menu when signed in.
  - `/` — browse photographers (search + filters, incl. experience) · `/photographers` redirects here
  - `/photographers/:id` — photographer profile
  - `/photographers/:id/book` — booking flow (`RequireAuth` + client only)
- **Signed-in workspaces** under `RequireAuth` → `PortalLayout`, which picks a shell by role:
  - **Client → `workspace/ClientShell.tsx`**: the shared `header/SiteHeader.tsx` (also used by `PublicLayout`) with the top navigation `CLIENT_LINKS` (Khám phá · Tổng quan · Lịch đặt · Đánh giá; a pill row under the header on phones), content centred at 1280px. Wallet/settings are in the avatar menu, messages in the header icon.
  - **Photographer → `workspace/StudioShell.tsx`**: full-height grouped sidebar (`STUDIO_NAV`) with the unread badge on "Tin nhắn".
  - Client workspace (`RequireRole ["client"]`): `/client`, `/client/bookings[/:id[/pay|/gallery]]`, `/client/reviews`
  - Photographer studio (`RequireRole ["photographer"]`): `/dashboard`, `/dashboard/{bookings,availability,portfolio,packages,storage,achievements,assistant}`
  - Shared: `/wallet`, `/settings/{profile,account,notifications}`
  - A role opening the other role's area is redirected to its own home. Signed-in pages are lazy-loaded per workspace (`App.tsx`).
- **Messages** (`/messages`, `RequireAuth`) is full-screen under its own `components/messages/MessagesLayout.tsx` (thin top bar, no sidebar): conversation list · thread · `ConversationInfo` (bookings between the two users; a Sheet below `xl`). Opening `?c=<id>` marks the thread read. The AI assistant only exists in client ↔ photographer threads (photographer toggles it). The sidebar "Tin nhắn" item shows the unread count.
- The app uses a **data router** (`createBrowserRouter` with one splat route around `<App/>` in `main.tsx`, `errorElement` = `components/RouteError.tsx`) so pages can use `useBlocker` — see `components/UnsavedChangesGuard.tsx`.
- **Back/forward cache:** `main.tsx` reloads a page restored from bfcache (`pageshow` + `persisted`) — MSW unregisters itself when the tab leaves the origin, and the session may have changed. `lib/api.ts` rejects HTML responses (`ERR_HTML_RESPONSE`) so a dead mock never feeds a web page to the views.
- Messaging entry points: the header 💬 icon (unread badge + preview), the studio sidebar item, and contextual `profile/MessageButton` (profile, booking detail, deposit success) which opens the exact thread. Counts use `CountBadge` (Ember) everywhere.

**Booking rules** (all in `src/lib/booking.ts`, shared by UI + MSW):
- Deposit `DEPOSIT_RATE` 30%, paid within `DEPOSIT_HOLD_MINUTES` (30') or the hold is released. Cancellation terms: `cancelTerms()` (`FREE_CANCEL_DAYS` = 7) — the handler and `CancelBookingDialog` use the same function.
- Packages have `photoCount / durationHours / deliveryDays`; a booking stores `packageSnapshot` at creation, and the client can only confirm receipt once `photos ≥ packageSnapshot.photoCount` (`deliveryProgress()`; enforced in `confirm-receipt`).
- Availability comes from the photographer's **work schedule** (`src/lib/schedule.ts`, `mock/schedules.ts`): weekly slots + busy dates, minus slots held by live bookings. `GET /api/photographers/:id/availability`, `GET/PUT /api/me/schedule` (saved only on "Lưu lịch"); `POST /api/bookings` rejects a taken slot with 409.
- Page layout: wrap signed-in pages in `<PageContainer>` + `<PageHeader>` and lay content out in grids — don't re-add narrow centred wrappers (the client shell already centres at 1280px). In-page status filters use `<StatusTabs>`. Public pages use the same 1280px frame as the header (`px-5 md:px-8`).

**Motion:** minimal (work surface). Fast, clear, data-first. Gentle transitions only — no hero effects, no parallax.

**Data:** portal owns its own `types/services/queries/msw/mock` (bookings, profiles, portfolio, messages…). Do NOT import data from `@lens/ui` or other apps. Services call HTTP (axios); MSW (`src/msw/`) mocks `/api/*` from `src/mock/` and owns the in-memory/localStorage stores + logic. Mock seed imported ONLY by `src/msw/handlers.ts`. See root §4b for the layers + the `VITE_API_MOCKING` toggle.
