import { lazy, Suspense, useState } from "react";
import { useTheme } from "next-themes";
import { Star } from "lucide-react";
import { photo } from "@lens/ui";

// Three.js scene is code-split: only fetched when we actually enable it.
const HeroParticles = lazy(() => import("./HeroParticles"));

// Decide once (at mount) whether the 3D accent should load at all. On mobile,
// coarse pointers, or prefers-reduced-motion we never import three.js.
function useEnable3D() {
  const [enabled] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches &&
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches
  );
  return enabled;
}

const floatingCards = [
  {
    src: photo("hero-portrait", 440, 560, "portrait"),
    label: "Chân dung",
    rating: "4.9",
    position: "left-0 top-6 w-[58%] z-20",
    rotate: "rotate-[-5deg]",
    depth: 0.18,
  },
  {
    src: photo("hero-wedding", 440, 600, "wedding"),
    label: "Cưới",
    rating: "5.0",
    position: "right-0 top-0 w-[52%] z-30",
    rotate: "rotate-[4deg]",
    depth: 0.32,
  },
  {
    src: photo("hero-travel", 440, 440, "travel"),
    label: "Du lịch",
    rating: "4.8",
    position: "bottom-0 left-[22%] w-[50%] z-10",
    rotate: "rotate-[2deg]",
    depth: 0.1,
  },
];

export function HeroVisual() {
  const enable3D = useEnable3D();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Background accent: 3D particles on capable devices, static gradient otherwise */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-[40px]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 70% 25%, color-mix(in oklch, var(--color-orchid-flash) 28%, transparent), transparent 70%), radial-gradient(55% 55% at 25% 80%, color-mix(in oklch, var(--color-ember) 26%, transparent), transparent 70%)",
          }}
        />
        {enable3D && (
          <Suspense fallback={null}>
            <HeroParticles dark={dark} />
          </Suspense>
        )}
      </div>

      {/* Floating photo cards. Position + parallax on <figure> (GSAP writes
          transform here); rotation lives on the inner wrapper so GSAP's
          translate doesn't clobber it. */}
      {floatingCards.map((card) => (
        <figure
          key={card.label}
          data-parallax
          data-depth={card.depth}
          className={`absolute ${card.position}`}
        >
          <div
            className={`relative overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_24px_60px_-24px_rgba(0,0,0,0.4)] ${card.rotate}`}
          >
            <img
              src={card.src}
              alt={`Ảnh ${card.label}`}
              loading="eager"
              decoding="async"
              className="aspect-[3/4] w-full object-cover"
            />
            <figcaption className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {card.label}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <Star className="size-3 fill-ember text-ember" />
                {card.rating}
              </span>
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
