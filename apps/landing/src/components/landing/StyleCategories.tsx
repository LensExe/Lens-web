import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Skeleton, cn, useReveal } from "@lens/ui";
import { portalBrowseStyle } from "@/lib/links";
import { useStyles } from "@/queries/useStyles";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Bento grid: 2 tall tiles + 8 small ones fill 2×6 (mobile) / 4×3 (desktop)
// exactly — no empty cell. Tile order + which are tall come from the data.
const GRID = "grid auto-rows-[150px] grid-cols-2 gap-4 grid-flow-row-dense lg:auto-rows-[180px] lg:grid-cols-4";

export function StyleCategories() {
  const scope = useRef<HTMLElement>(null);
  const { data: styles, isLoading } = useStyles();
  useReveal(scope, [styles]);

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
    { scope, dependencies: [styles], revertOnUpdate: true }
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

        <div className={cn("mt-10", GRID)}>
          {isLoading &&
            Array.from({ length: 10 }, (_, i) => (
              <Skeleton
                key={i}
                className={cn("rounded-[28px]", (i === 0 || i === 5) && "row-span-2")}
              />
            ))}

          {styles?.map((style) => (
            <a
              key={style.id}
              data-reveal
              href={portalBrowseStyle(style.label)}
              className={cn(
                "focus-ring group relative overflow-hidden rounded-[28px]",
                style.large && "row-span-2"
              )}
            >
              <img
                data-cat-img
                src={style.image}
                alt={style.label}
                loading="lazy"
                className="size-full object-cover brightness-95 transition-[filter] duration-500 ease-out group-hover:brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-obsidian opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <ArrowUpRight className="size-4" />
              </span>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className={cn("font-semibold", style.large ? "text-xl" : "text-lg")}>
                  {style.label}
                </p>
                <p className="text-xs text-white/75">
                  {style.photographerCount} nhiếp ảnh gia
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
