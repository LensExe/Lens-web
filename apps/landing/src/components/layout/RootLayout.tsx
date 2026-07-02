import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ClickSpark } from "@lens/ui";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AuthModalProvider } from "@/components/auth/auth-modal";
import { useSmoothScroll, scrollToHash } from "@lens/ui";
import { usePrefersReducedMotion } from "@lens/ui";

export function RootLayout() {
  useSmoothScroll();
  const reduceMotion = usePrefersReducedMotion();
  const location = useLocation();

  // Scroll to an anchor when landing with a hash (e.g. from another route or a
  // refresh on /#phong-cach). Delayed a tick so the target section has mounted.
  useEffect(() => {
    if (!location.hash) return;
    const id = setTimeout(() => scrollToHash(location.hash), 80);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash]);
  // ClickSpark paints a full-page canvas — only enable on pointer-fine
  // desktops; skip on mobile/reduced-motion to stay light.
  const [enableSpark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches &&
      window.matchMedia("(pointer: fine)").matches
  );

  const content = (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );

  const withSpark =
    reduceMotion || !enableSpark ? (
      content
    ) : (
      <ClickSpark sparkColor="#ff5a00" sparkSize={9} sparkRadius={18} sparkCount={8} duration={450}>
        {content}
      </ClickSpark>
    );

  return <AuthModalProvider>{withSpark}</AuthModalProvider>;
}
