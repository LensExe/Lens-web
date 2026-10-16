import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button, Skeleton, cn, useReveal } from "@lens/ui";
import { PhotographerCard } from "@/components/shared/PhotographerCard";
import { portalBrowseStyle } from "@/lib/links";
import { useStyles } from "@/queries/useStyles";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Bento grid keeps the featured photography styles in a flowing tile layout.
const GRID =
  "grid auto-rows-[132px] grid-cols-2 gap-3 grid-flow-row-dense sm:auto-rows-[160px] sm:gap-4 lg:auto-rows-[178px] lg:grid-cols-4";

export function StyleCategories() {
  const scope = useRef<HTMLElement>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const { data: styles, isLoading } = useStyles();

  const selectedStyle = styles?.find((style) => style.id === selectedStyleId) ?? null;

  useReveal(scope, [styles, selectedStyle]);

  // Gentle scroll parallax on each tile image (transform-only, gated).
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const imgs = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-cat-img]"));
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
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies: [styles], revertOnUpdate: true },
  );

  return (
    <section id="phong-cach" ref={scope} className="scroll-mt-20 px-5 py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Phong cách chụp</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Dù bạn cần loại ảnh nào, luôn có một nhiếp ảnh gia phù hợp trên Lens.
            </p>
          </div>
        </div>

        <div className={cn("mt-8 sm:mt-10", GRID)}>
          {isLoading &&
            Array.from({ length: 10 }, (_, i) => (
              <Skeleton
                key={i}
                className={cn("rounded-[28px]", (i === 0 || i === 5) && "row-span-2")}
              />
            ))}

          {styles?.map((style) => {
            const isSelected = style.id === selectedStyleId;

            return (
              <button
                key={style.id}
                type="button"
                aria-pressed={isSelected}
                aria-controls="style-photographers"
                onClick={() => setSelectedStyleId(isSelected ? null : style.id)}
                data-reveal
                className={cn(
                  "focus-ring group relative overflow-hidden rounded-[28px] text-left",
                  style.large && "row-span-2",
                  isSelected && "ring-2 ring-ember ring-offset-2 ring-offset-background",
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
                  {isSelected ? <Check className="size-4" /> : <ArrowUpRight className="size-4" />}
                </span>
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className={cn("font-semibold", style.large ? "text-xl" : "text-lg")}>
                    {style.label}
                  </p>
                  <p className="text-xs text-white/75">
                    {style.representative ? "Có photographer nổi bật" : "Đang cập nhật"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedStyle && (
          <div
            id="style-photographers"
            data-reveal
            className="mt-8 rounded-[28px] border border-border/80 bg-card p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                  Đang chọn phong cách
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                  Nhiếp ảnh gia phong cách {selectedStyle.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Photographer nổi bật nhất phù hợp với phong cách bạn chọn.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <a href={portalBrowseStyle(selectedStyle.label)}>
                  Xem tất cả
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            {selectedStyle.representative ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PhotographerCard photographer={selectedStyle.representative} />
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Chưa có gợi ý nổi bật cho phong cách này. Hãy xem toàn bộ danh sách để tìm thêm.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
