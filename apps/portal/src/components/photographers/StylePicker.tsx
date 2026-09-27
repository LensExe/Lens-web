import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { photo, cn } from "@lens/ui";
import { STYLE_CATEGORIES } from "@/lib/style-catalog";
import type { PhotoStyle } from "@/types";

interface StylePickerProps {
  selected: PhotoStyle[];
  onToggle: (style: PhotoStyle) => void;
}

const STYLES = STYLE_CATEGORIES.flatMap((c) => c.styles);

// Horizontally scrolling strip of style tiles above the results; a tile toggles
// the `styles` filter. No visible scrollbar: edges fade where there is more to
// see, arrow buttons scroll on desktop, and phones just swipe.
export function StylePicker({ selected, onToggle }: StylePickerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };
  const scrollBy = (dir: 1 | -1) =>
    scrollerRef.current?.scrollBy({ left: dir * scrollerRef.current.clientWidth * 0.8, behavior: "smooth" });

  // Fade only the edge(s) that still hide tiles.
  const mask =
    !edges.start && !edges.end
      ? "[mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)]"
      : !edges.end
        ? "[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]"
        : !edges.start
          ? "[mask-image:linear-gradient(to_right,transparent,black_40px)]"
          : "";

  return (
    <section aria-label="Chọn nhanh theo phong cách" className="mb-6">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Chọn nhanh theo phong cách</h2>
        <span className="text-xs text-muted-foreground sm:hidden">Vuốt để xem thêm →</span>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className={cn(
            "flex snap-x gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            mask
          )}
        >
          {STYLES.map((s) => {
            const active = selected.includes(s.style);
            return (
              <button
                key={s.style}
                type="button"
                onClick={() => onToggle(s.style)}
                aria-pressed={active}
                title={s.description}
                className={cn(
                  "focus-ring group relative my-1 h-20 w-28 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-all",
                  active ? "border-foreground ring-2 ring-foreground" : "border-transparent hover:-translate-y-0.5"
                )}
              >
                <img
                  src={photo(s.seed, 224, 160, s.keyword)}
                  alt={s.style}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <Check className="size-3" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-1.5 text-xs font-semibold text-white">
                  {s.style}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop arrows — only where there is more to scroll to */}
        {!edges.start && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Xem phong cách trước"
            className="focus-ring absolute left-1 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm transition-colors hover:bg-muted sm:flex"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
        {!edges.end && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Xem thêm phong cách"
            className="focus-ring absolute right-1 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm transition-colors hover:bg-muted sm:flex"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>
    </section>
  );
}
