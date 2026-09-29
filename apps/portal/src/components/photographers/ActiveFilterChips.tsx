import { X } from "lucide-react";
import { formatPrice } from "@lens/ui";
import {
  EXPERIENCE_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  RATING_OPTIONS,
  isPriceActive,
  type Filters,
} from "@/lib/photographer-filters";

const dayMonth = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}/${m}`;
};

/**
 * What's narrowing the results, as removable chips next to the result count —
 * so a filter set in the sidebar (or a style tile) is visible and undoable
 * right where the results are.
 */
export function ActiveFilterChips({
  filters,
  onChange,
  onClearAll,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, remove: () => onChange({ q: "" }) }] : []),
    ...filters.styles.map((s) => ({
      key: `style-${s}`,
      label: s,
      remove: () => onChange({ styles: filters.styles.filter((x) => x !== s) }),
    })),
    ...(filters.city ? [{ key: "city", label: filters.city, remove: () => onChange({ city: "" }) }] : []),
    ...(isPriceActive(filters)
      ? [
          {
            key: "price",
            label: `${formatPrice(filters.priceMin)} – ${formatPrice(filters.priceMax)}`,
            remove: () => onChange({ priceMin: PRICE_MIN, priceMax: PRICE_MAX }),
          },
        ]
      : []),
    ...(filters.date
      ? [{ key: "date", label: `Rảnh ngày ${dayMonth(filters.date)}`, remove: () => onChange({ date: "" }) }]
      : []),
    ...(filters.rating
      ? [
          {
            key: "rating",
            label: RATING_OPTIONS.find((r) => r.value === filters.rating)?.label ?? filters.rating,
            remove: () => onChange({ rating: "" }),
          },
        ]
      : []),
    ...(filters.exp
      ? [
          {
            key: "exp",
            label: EXPERIENCE_OPTIONS.find((o) => o.value === filters.exp)?.label ?? filters.exp,
            remove: () => onChange({ exp: "" }),
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card py-0.5 pl-2.5 pr-0.5 text-xs"
        >
          <span className="truncate">{c.label}</span>
          <button
            type="button"
            onClick={c.remove}
            aria-label={`Bỏ lọc ${c.label}`}
            className="focus-ring flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="focus-ring rounded-full px-1.5 py-0.5 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Xoá tất cả
        </button>
      )}
    </div>
  );
}
