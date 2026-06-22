import { useEffect, type RefObject } from "react";

/**
 * Lightweight scroll-reveal. Fades + rises any `[data-reveal]` element inside
 * `scope` as it enters the viewport, with a small cyclic stagger. Uses
 * IntersectionObserver + CSS only (no animation library) to keep the portal
 * bundle lean. Fully visible immediately under `prefers-reduced-motion`.
 */
export function useScrollReveal(
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      els.forEach((el) => el.classList.add("reveal-in"));
      return;
    }

    const reveal = (el: HTMLElement) => {
      el.classList.remove("reveal-init");
      el.classList.add("reveal-in");
    };

    els.forEach((el, i) => {
      el.style.setProperty("--reveal-delay", `${(i % 6) * 0.06}s`);
      el.classList.add("reveal-init");
    });

    // Reveal anything already in view on mount immediately — don't make
    // above-the-fold content wait on the observer (which can be slow/unreliable).
    const vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.95) reveal(el);
    });

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          obs.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    els.forEach((el) => {
      if (el.classList.contains("reveal-init")) io.observe(el);
    });

    // Safety net: never leave content permanently hidden if the observer
    // never fires (headless browsers, edge cases). Reveals stragglers only.
    const safety = window.setTimeout(() => els.forEach(reveal), 1600);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
