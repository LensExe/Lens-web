// Deferred promise that resolves once the mock backend (MSW worker) is online.
// The axios request interceptor awaits this, so requests fired during app boot
// queue up instead of racing the not-yet-ready worker (queries stay in their
// loading/skeleton state meanwhile). When mocking is disabled it resolves
// immediately, adding no latency to a real backend.
let resolveReady: () => void = () => {};

export const mockReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function markMockReady() {
  resolveReady();
}
