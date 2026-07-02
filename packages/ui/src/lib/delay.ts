// Fake-latency helper so loading skeletons are visible in the UI-only phase.
// Used by the MSW mock backend (src/msw/handlers.ts) before returning mock data.
// Kept low so the first page after login/redirect feels snappy (queries fan out
// in parallel, so this is roughly the per-page wait).
export const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms));
