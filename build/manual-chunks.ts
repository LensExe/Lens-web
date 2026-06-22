// Shared vendor-chunking strategy for all apps' Vite builds.
// Splits big, always-eager vendors into their own chunks so the initial
// chunk stays lean and vendor code caches across app-code deploys.
//
// IMPORTANT: animation/3D libs (three, gsap, framer-motion…) are left
// untouched so they keep their natural per-import code-splitting — e.g.
// landing's lazy desktop-only 3D hero must NOT be pulled into an eager
// vendor chunk.
export function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return;

  // Leave heavy animation/3D to dynamic-import code-splitting.
  if (/[\\/](three|gsap|@gsap|framer-motion|motion-dom|motion-utils|@react-three)[\\/]/.test(id)) {
    return;
  }

  if (/[\\/](react-dom|scheduler)[\\/]/.test(id)) return "react-dom";
  if (/[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "router";
  if (/[\\/]@tanstack[\\/]/.test(id)) return "query";
  if (/[\\/](radix-ui|react-day-picker|date-fns)[\\/]/.test(id)) return "ui-vendor";
  return "vendor";
}
