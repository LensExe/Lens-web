import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Scroll-reveal for any element marked [data-reveal] inside `scope`.
// Staggered fade + rise via ScrollTrigger.batch. Transform/opacity only.
// Collapses to fully-visible static content under prefers-reduced-motion.
export function useReveal(
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const els = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll("[data-reveal]")
      );
      if (!els.length) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(els, { opacity: 0, y: 28, scale: 0.985 });
        ScrollTrigger.batch(els, {
          start: "top 88%",
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              stagger: 0.09,
              ease: "power3.out",
              overwrite: true,
            }),
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies: deps }
  );
}
