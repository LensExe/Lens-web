import { useState } from "react";
import { CalendarDays, ChevronDown, RotateCcw, X } from "lucide-react";
import {
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
  cn,
  formatPrice,
} from "@lens/ui";
import {
  CITY_OPTIONS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  RATING_OPTIONS,
  STYLE_OPTIONS,
  countActiveFilters,
  type Filters,
} from "@/lib/photographer-filters";
import type { PhotoStyle } from "@/types";

interface FilterPanelProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDateVN = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-ring rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PriceSection({ filters, onChange }: Pick<FilterPanelProps, "filters" | "onChange">) {
  // Local range for smooth dragging; URL is updated only on commit (release).
  // The caller remounts this via `key` when the committed price changes, so the
  // initial state stays in sync without a set-state-in-effect.
  const [range, setRange] = useState<[number, number]>([filters.priceMin, filters.priceMax]);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Mức giá / buổi</h3>
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]])}
        onValueCommit={(v) => onChange({ priceMin: v[0], priceMax: v[1] })}
        aria-label="Khoảng giá"
      />
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatPrice(range[0])}</span>
        <span>
          {range[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(range[1])}
        </span>
      </div>
    </div>
  );
}

function DateSection({ filters, onChange }: Pick<FilterPanelProps, "filters" | "onChange">) {
  const [open, setOpen] = useState(false);
  const selected = filters.date ? fromISODate(filters.date) : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Ngày rảnh</h3>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="focus-ring flex flex-1 items-center justify-between rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                {selected ? formatDateVN(selected) : "Bất kỳ ngày nào"}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              disabled={{ before: today }}
              onSelect={(d) => {
                onChange({ date: d ? toISODate(d) : "" });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {filters.date && (
          <button
            type="button"
            onClick={() => onChange({ date: "" })}
            aria-label="Xoá ngày"
            className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const toggleStyle = (style: PhotoStyle) => {
    const styles = filters.styles.includes(style)
      ? filters.styles.filter((s) => s !== style)
      : [...filters.styles, style];
    onChange({ styles });
  };

  const activeCount = countActiveFilters(filters);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Bộ lọc</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="focus-ring rounded-md flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Xoá lọc
          </button>
        )}
      </div>

      <Section title="Phong cách">
        {STYLE_OPTIONS.map((style) => (
          <Chip key={style} active={filters.styles.includes(style)} onClick={() => toggleStyle(style)}>
            {style}
          </Chip>
        ))}
      </Section>

      <Section title="Thành phố">
        <Chip active={!filters.city} onClick={() => onChange({ city: "" })}>
          Tất cả
        </Chip>
        {CITY_OPTIONS.map((city) => (
          <Chip
            key={city}
            active={filters.city === city}
            onClick={() => onChange({ city: filters.city === city ? "" : city })}
          >
            {city}
          </Chip>
        ))}
      </Section>

      <PriceSection
        key={`${filters.priceMin}-${filters.priceMax}`}
        filters={filters}
        onChange={onChange}
      />

      <DateSection filters={filters} onChange={onChange} />

      <Section title="Đánh giá">
        <Chip active={!filters.rating} onClick={() => onChange({ rating: "" })}>
          Tất cả
        </Chip>
        {RATING_OPTIONS.map((r) => (
          <Chip
            key={r.value}
            active={filters.rating === r.value}
            onClick={() => onChange({ rating: filters.rating === r.value ? "" : r.value })}
          >
            {r.label}
          </Chip>
        ))}
      </Section>
    </div>
  );
}
