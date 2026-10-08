import { cn } from "../../lib/utils";

export interface BarDatum {
  label: string;
  value: number;
}

// Round the axis top up to a friendly number (…, 20, 25, 40, 50, 100 × 10^n).
function niceMax(max: number): number {
  if (max <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(max));
  const step = mag / 2;
  return Math.ceil(max / step) * step;
}

/**
 * Single-series vertical bar chart (e.g. revenue per month). Plain HTML/CSS —
 * no chart library. Recessive dashed grid + axis labels, thin 4px-rounded bars
 * anchored to the baseline, a hover tooltip on every bar. Restrained colour:
 * bars are grey and the highlighted one (default: the latest) is Ember, with a
 * direct label. A visually-hidden table carries the same data for screen
 * readers. One series → no legend (the card title names it).
 */
export function BarChart({
  data,
  format = (v) => String(v),
  color = "var(--chart-muted)",
  highlight = "last",
  height = 200,
  ariaLabel,
  className,
}: {
  data: BarDatum[];
  format?: (value: number) => string;
  /** Colour of the ordinary bars (defaults to the muted chart grey). */
  color?: string;
  /** Bar drawn in Ember with a direct label — "last", an index, or "none". */
  highlight?: "last" | "none" | number;
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [top, top / 2, 0];
  const accent = highlight === "last" ? data.length - 1 : highlight === "none" ? -1 : highlight;

  return (
    <figure className={cn("w-full", className)} aria-label={ariaLabel}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        {/* Y axis */}
        <div
          className="flex flex-col justify-between text-right text-[11px] text-muted-foreground tabular-nums"
          style={{ height }}
          aria-hidden
        >
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {format(t)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <div
              key={t}
              className={cn(
                "absolute inset-x-0 border-t",
                t === 0 ? "border-border" : "border-dashed border-border/70"
              )}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
            {data.map((d, i) => {
              const pct = (d.value / top) * 100;
              return (
                <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-14 rounded-t-[4px] opacity-85 transition-opacity group-hover:opacity-100"
                    style={{ height: `${pct}%`, background: i === accent ? "var(--color-ember)" : color }}
                  />
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                      i === accent
                        ? "text-foreground"
                        : "bg-popover text-popover-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100"
                    )}
                    style={{ bottom: `calc(${pct}% + 4px)` }}
                  >
                    {format(d.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* X labels */}
        <div aria-hidden />
        <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden>
          {data.map((d) => (
            <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
              {d.label}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
