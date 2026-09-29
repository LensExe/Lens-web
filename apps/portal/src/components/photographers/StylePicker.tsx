import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@lens/ui";
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
    <section aria-label="Chọn nhanh theo phong cách" className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Phong cách phổ biến</h2>
        <span className="text-[10px] text-muted-foreground sm:hidden">Vuốt để xem →</span>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className={cn(
            "flex snap-x gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
                  "focus-ring inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                  active
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border/70 bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground",
                )}
              >
                {active && (
                  <Check className="size-3.5" />
                )}
                {s.style}
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
            className="focus-ring absolute left-0.5 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm transition-colors hover:bg-muted sm:flex"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
        {!edges.end && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Xem thêm phong cách"
            className="focus-ring absolute right-0.5 top-1/2 hidden size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-sm transition-colors hover:bg-muted sm:flex"
          >
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}
