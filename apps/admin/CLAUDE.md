# CLAUDE.md — apps/admin

> Read the root `CLAUDE.md` first. This file only adds admin-specific notes.

**Role:** internal admin console. Dev port **5175**. Kept as a separate app for isolation.

**Routes (root-relative, since it's its own deployment):**
- `/` tổng quan · Vận hành: `/photographers` (duyệt NAG), `/users`, `/bookings` · Tài chính: `/finance`, `/storage` · Chất lượng & báo cáo: `/quality`, `/reports`
- Layout: `src/components/AdminLayout.tsx` — full-height sidebar from `components/layout/nav.ts` (grouped items + queue badges from `GET /api/admin/queue` via `useAdminQueue`), admin card with sign-out (→ `/login`), sticky header with the page title.
- Pages use `PageContainer` + `PageHeader` + `StatCard` + `StatusTabs` (with counts) from `@lens/ui`. Shared admin bits: `UserCell`, `StatusPill` (+ `*_META` in `lib/status.ts`), `EmptyState`, `ConfirmDialog` (every approve / reject / lock / payout asks first), `PhotoLightbox`.
- Tables: every list uses `components/DataTable.tsx` — one card with optional `tabs` (StatusTabs) + `toolbar` (search) header, light header row, built-in skeleton (`isLoading`) and `empty` state, pagination footer. Columns use `data-table/ColumnHeader` and the `NUM` / `ACTIONS` meta + `chevronColumn()` from `data-table/columns.tsx`. Keep `"use no memo"` in anything that receives the TanStack table/column.
- Photographer approval: `/photographers` list → full page `/photographers/:id` (`routes/ApplicationReview.tsx`): facts + "Gợi ý kiểm tra" + decision on the left (sticky), large portfolio masonry + lightbox on the right, prev/next through the pending queue; after a decision it moves to the next pending one. Approve is confirmed; **reject requires a reason** (quick-reason chips; `reviewNote` + `reviewedAt` stored by the handler, 400 without it). Portfolio images point at the portal's `/public/photos` through `VITE_PORTAL_URL` (not copied into admin).
- Router & errors: data router with `errorElement` (`components/RouteError.tsx`); `main.tsx` reloads on back/forward-cache restore and `lib/api.ts` rejects HTML responses (see portal CLAUDE.md).
- Any mutation that adds/clears an admin task must invalidate `queueKey` so the sidebar badges stay right.
- Auth: own `/login` page (`src/routes/Login.tsx`), never linked from the public site. `RequireAdmin` gates the console; the session lives in `src/lib/session.ts` (localStorage, UI phase). Accounts: `src/mock/admins.ts` → `POST /api/auth/login`.

**Motion:** minimal. Data-heavy tables stay static. Use **ReUI** Data Grid / Filters / Stepper for the table-heavy screens.

**Key feature later:** photographer `approval_status` gate — new photographers are `pending` and hidden from public until approved here.

**Data:** admin owns its own `types/services/queries/msw/mock/stores` (users, approvals, reports, system stats). Services call HTTP (axios); MSW (`src/msw/`) mocks `/api/*` from `src/mock/` and owns the in-memory stores + logic. Mock seed imported ONLY by `src/msw/handlers.ts`. See root §4b for the layers + the `VITE_API_MOCKING` toggle.
