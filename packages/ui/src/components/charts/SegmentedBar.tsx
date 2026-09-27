import { cn } from "../../lib/utils";

export interface Segment {
  label: string;
  value: number;
  /** CSS colour — use `var(--ordinal-N)` for ordered tiers, `var(--chart-N)` for categories. */
  color: string;
}

/**
 * Part-of-whole bar (e.g. storage plans, rank distribution) with a legend that
 * always names every segment with its value and share — identity never rests on
 * colour alone. 2px surface gaps separate the segments.
 */
export function SegmentedBar({
  segments,
  format = (v) => String(v),
  className,
}: {
  segments: Segment[];
  format?: (value: number) => string;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className={className}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                title={`${s.label}: ${format(s.value)}`}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ flexGrow: s.value, flexBasis: 0, background: s.color }}
              />
            ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className={cn("font-medium tabular-nums")}>{format(s.value)}</span>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.round((s.value / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
