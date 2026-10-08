import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useSmoothScroll, scrollToHash } from "@lens/ui";

export function RootLayout() {
  useSmoothScroll();
  const location = useLocation();

  // Lazy sections, skeleton→content swaps and late images change the page
  // height AFTER ScrollTriggers measured their start/end — which makes pins
  // and reveals fire at the wrong spot. Re-measure (debounced) whenever the
  // document height changes.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Scroll to an anchor when landing with a hash (e.g. from another route or a
  // refresh on /#phong-cach). Delayed a tick so the target section has mounted.
  useEffect(() => {
    if (!location.hash) return;
    const id = setTimeout(() => scrollToHash(location.hash), 80);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
