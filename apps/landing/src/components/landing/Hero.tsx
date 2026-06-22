import { lazy, Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, Search, Sparkles } from "lucide-react";
import { Button } from "@lens/ui";
import { Magnet } from "@lens/ui";
import { usePrefersReducedMotion } from "@lens/ui";
import { portalBrowse } from "@/lib/links";
import { AnimatedHeadline } from "./AnimatedHeadline";
import { HeroVisual } from "./HeroVisual";

// Lazy so `motion` stays out of the initial bundle (static word until loaded).
const RotatingText = lazy(() => import("@lens/ui/components/effects/RotatingText"));

gsap.registerPlugin(useGSAP, ScrollTrigger);

const popularStyles = ["Chân dung", "Cưới", "Thời trang", "Du lịch", "Ẩm thực"];

export function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const scope = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  // Hero motion (all transform-only, gated by prefers-reduced-motion):
  //  - scroll parallax on the floating cards
  //  - pointer parallax on the whole visual group (desktop / fine pointer)
  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-parallax]");
        cards.forEach((card) => {
          const depth = Number(card.dataset.depth ?? 0.15);
          gsap.to(card, {
            yPercent: -depth * 100,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        // Pointer parallax — only with a fine pointer (skip touch).
        let cleanupPointer: (() => void) | undefined;
        if (
          visualRef.current &&
          contextSafe &&
          window.matchMedia("(pointer: fine)").matches
        ) {
          const xTo = gsap.quickTo(visualRef.current, "x", { duration: 0.7, ease: "power3" });
          const yTo = gsap.quickTo(visualRef.current, "y", { duration: 0.7, ease: "power3" });
          const rTo = gsap.quickTo(visualRef.current, "rotation", { duration: 0.7, ease: "power3" });
          const onMove = contextSafe((e: MouseEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            xTo(nx * 28);
            yTo(ny * 22);
            rTo(nx * 2.4);
          });
          window.addEventListener("mousemove", onMove, { passive: true });
          cleanupPointer = () => window.removeEventListener("mousemove", onMove);
        }
        return () => cleanupPointer?.();
      });
      return () => mm.revert();
    },
    { scope }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = portalBrowse(query);
  };

  return (
    <section
      ref={scope}
      className="relative overflow-hidden px-5 pt-12 pb-20 md:pt-20 lg:pb-28"
    >
      {/* Soft canvas wash behind everything */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "var(--color-ash)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 30% 30%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 30% 30%, black 20%, transparent 70%)",
        }}
      />

      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-8">
        {/* Left: copy */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-4 text-ember" />
            Hơn 1.200 nhiếp ảnh gia trên khắp Việt Nam
          </span>

          <AnimatedHeadline
            className="mt-6 text-4xl leading-[1.08] sm:text-5xl lg:text-5xl xl:text-[3.5rem]"
            segments={[[{ text: "Tìm nhiếp ảnh gia" }], [{ text: "cho mọi" }]]}
            trailing={
              <Suspense
                fallback={<span className="text-ash dark:text-steel">khoảnh khắc</span>}
              >
                <RotatingText
                  texts={["khoảnh khắc", "ngày cưới", "chân dung", "chuyến đi", "bữa tiệc"]}
                  rotationInterval={2200}
                  staggerDuration={0.02}
                  mainClassName="inline-flex overflow-hidden align-bottom text-ash dark:text-steel"
                  splitLevelClassName="overflow-hidden"
                />
              </Suspense>
            }
          />

          <p
            className="mt-5 max-w-md text-base text-muted-foreground md:text-lg"
            style={{
              animation: "rise-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s both",
            }}
          >
            Xem portfolio, so sánh đánh giá và đặt lịch với nhiếp ảnh gia phù hợp,
            tất cả trên một nền tảng.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="mt-7 flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-card p-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]"
            style={{
              animation: "rise-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.6s both",
            }}
          >
            <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Phong cách, địa điểm hoặc tên..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Tìm kiếm nhiếp ảnh gia"
            />
            <Button type="submit" className="rounded-full px-5">
              Tìm kiếm
            </Button>
          </form>

          {/* CTAs */}
          <div
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            style={{
              animation: "rise-in 0.7s cubic-bezier(0.22,1,0.36,1) 0.72s both",
            }}
          >
            <Magnet padding={70} magnetStrength={4} disabled={reduceMotion}>
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => {
                  window.location.href = portalBrowse();
                }}
              >
                <Search className="size-4" />
                Tìm nhiếp ảnh gia
              </Button>
            </Magnet>
            <Magnet padding={70} magnetStrength={4} disabled={reduceMotion}>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6"
                onClick={() => navigate("/signup")}
              >
                <Camera className="size-4" />
                Trở thành nhiếp ảnh gia
              </Button>
            </Magnet>
          </div>

          {/* Quick style chips */}
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Phổ biến:</span>
            {popularStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  window.location.href = portalBrowse(style);
                }}
                className="rounded-full border border-border bg-background/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Right: visual. Entrance (CSS) on the outer wrapper; pointer
            parallax (GSAP transform) on the inner ref to avoid clashing. */}
        <div
          className="order-first lg:order-last"
          style={{
            animation: "rise-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both",
          }}
        >
          <div ref={visualRef}>
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
