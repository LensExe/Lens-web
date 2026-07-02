import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The live Lenis instance (if smooth scroll is active) so programmatic scrolls
// (anchor nav) go THROUGH Lenis instead of fighting it.
let activeLenis: Lenis | null = null;

/**
 * Smooth-scroll to an in-page anchor (e.g. "#phong-cach"). Goes through Lenis
 * when active, otherwise falls back to native smooth scrolling. `offset`
 * compensates for the sticky header (negative = stop above the target).
 */
export function scrollToHash(hash: string, offset = -72) {
  if (typeof document === "undefined" || !hash.startsWith("#")) return;
  const el = document.querySelector(hash);
  if (!el) return;
  if (activeLenis) {
    activeLenis.scrollTo(el as HTMLElement, { offset });
  } else {
    const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

// Smooth wheel scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger
// stays in sync. Touch scrolling stays native (better mobile feel + perf).
// Disabled entirely under prefers-reduced-motion.
export function useSmoothScroll() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    activeLenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
      activeLenis = null;
    };
  }, []);
}
