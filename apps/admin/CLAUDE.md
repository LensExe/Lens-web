# CLAUDE.md — apps/admin

> Read the root `CLAUDE.md` first. This file only adds admin-specific notes.

**Role:** internal admin console. Dev port **5175**. Kept as a separate app for isolation.

**Routes (root-relative, since it's its own deployment):**
- `/` tổng quan, `/photographers` (duyệt NAG), `/users`, `/reports`
- Layout: `src/components/AdminLayout.tsx` (sidebar + top bar + "Đăng xuất" back to landing).

**Motion:** minimal. Data-heavy tables stay static. Use **ReUI** Data Grid / Filters / Stepper for the table-heavy screens.

**Key feature later:** photographer `approval_status` gate — new photographers are `pending` and hidden from public until approved here.

**Data:** admin owns its own `types/services/queries/msw/mock/stores` (users, approvals, reports, system stats). Services call HTTP (axios); MSW (`src/msw/`) mocks `/api/*` from `src/mock/` and owns the in-memory stores + logic. Mock seed imported ONLY by `src/msw/handlers.ts`. See root §4b for the layers + the `VITE_API_MOCKING` toggle.
