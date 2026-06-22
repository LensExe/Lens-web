import { useRef } from "react";
import { portalBrowse } from "@/lib/links";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { photo, useReveal } from "@lens/ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const categories = [
  { label: "Chân dung", seed: "cat-portrait", span: "row-span-2" },
  { label: "Cưới", seed: "cat-wedding", span: "" },
  { label: "Thời trang", seed: "cat-fashion", span: "" },
  { label: "Du lịch", seed: "cat-travel", span: "row-span-2" },
  { label: "Ẩm thực", seed: "cat-food", span: "" },
  { label: "Sự kiện", seed: "cat-event", span: "" },
];

export function StyleCategories() {
  const scope = useRef<HTMLElement>(null);
  useReveal(scope);

  // Gentle scroll parallax on each tile image (transform-only, gated).
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const imgs = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll("[data-cat-img]")
        );
        imgs.forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -6, scale: 1.14 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: img,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });
      return () => mm.revert();
    },
    { scope }
  );

  return (
    <section id="phong-cach" ref={scope} className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Phong cách chụp</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Dù bạn cần loại ảnh nào, luôn có một nhiếp ảnh gia phù hợp trên Lens.
            </p>
          </div>
        </div>

        <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <a
              key={cat.label}
              data-reveal
              href={portalBrowse(cat.label)}
              className={`focus-ring group relative overflow-hidden rounded-[28px] ${cat.span}`}
            >
              <img
                data-cat-img
                src={photo(cat.seed, 600, 600, cat.seed.replace("cat-", ""))}
                alt={cat.label}
                loading="lazy"
                className="size-full object-cover brightness-95 transition-[filter] duration-500 ease-out group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/70" />
              <span className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                {cat.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
