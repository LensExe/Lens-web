// Fake-latency helper so loading skeletons are visible in the UI-only phase.
// Used by the service layer (src/services/*) before returning mock data.
export const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
