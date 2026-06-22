import { useState } from "react";

// Reads the user's motion preference once at mount (lazy init, no effect).
export function usePrefersReducedMotion() {
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  return reduce;
}
