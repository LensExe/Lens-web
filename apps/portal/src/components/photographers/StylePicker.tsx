import { Check } from "lucide-react";
import { photo, cn } from "@lens/ui";
import { STYLE_CATEGORIES } from "@/lib/style-catalog";
import type { PhotoStyle } from "@/types";

interface StylePickerProps {
  selected: PhotoStyle[];
  onToggle: (style: PhotoStyle) => void;
}

const STYLES = STYLE_CATEGORIES.flatMap((c) => c.styles);

// Compact, horizontally-scrollable strip of style tiles (feedback R1 iteration:
// the earlier stacked-shelves block was too tall/cluttered at the top). Sits
// just above the results grid; clicking a tile toggles the `styles` filter.
export function StylePicker({ selected, onToggle }: StylePickerProps) {
  return (
    <section aria-label="Chọn nhanh theo phong cách" className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Chọn nhanh theo phong cách</h2>
        <span className="text-xs text-muted-foreground">Vuốt để xem thêm →</span>
      </div>
      <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
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
                "focus-ring group relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-all",
                active
                  ? "border-foreground ring-2 ring-foreground"
                  : "border-transparent hover:-translate-y-0.5"
              )}
            >
              <img
                src={photo(s.seed, 224, 160, s.keyword)}
                alt={s.style}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
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
    </section>
  );
}
