// Fake-latency helper so loading skeletons are visible in the UI-only phase.
// Used by the MSW mock backend (src/msw/handlers.ts) before returning mock data.
export const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));
