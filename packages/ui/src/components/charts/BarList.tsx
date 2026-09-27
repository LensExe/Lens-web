import { cn } from "../../lib/utils";

export interface BarListItem {
  label: string;
  value: number;
}

/**
 * Ranked horizontal bars (e.g. bookings by style / city): label + value + share
 * on one line, a thin bar underneath scaled to the largest item. Bars use the
 * secondary accent (Lagoon) — one colour for the whole series.
 */
export function BarList({
  items,
  format = (v) => String(v),
  color = "var(--chart-lagoon)",
  showShare = true,
  className,
}: {
  items: BarListItem[];
  format?: (value: number) => string;
  color?: string;
  showShare?: boolean;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;

  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(item.value)}
              {showShare && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {Math.round((item.value / total) * 100)}%
                </span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
