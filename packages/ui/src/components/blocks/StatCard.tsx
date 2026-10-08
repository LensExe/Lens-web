import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * KPI tile: a neutral icon chip, big value, label — plus an optional change vs
 * the previous period (the only colour: green/red by meaning) and a small hint
 * line. Router-agnostic: wrap it in your own link and pass `interactive`.
 */
export function StatCard({
  icon: Icon,
  value,
  label,
  delta,
  deltaLabel = "so với tháng trước",
  goodWhen = "up",
  hint,
  interactive = false,
  className,
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  /** Percent change vs the previous period (e.g. 12.5 or -4). */
  delta?: number;
  deltaLabel?: string;
  /** Whether a rise is good (revenue) or bad (cancel rate) — sets the colour. */
  goodWhen?: "up" | "down";
  hint?: ReactNode;
  interactive?: boolean;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const good = goodWhen === "up" ? up : !up;

  return (
    <div
      className={cn(
        "portal-stat-card flex h-full flex-col rounded-2xl border border-border bg-card p-5",
        interactive && "transition-colors hover:bg-muted/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="size-5" />
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              good
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
            )}
            title={deltaLabel}
          >
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {up ? "+" : ""}
            {delta.toFixed(Math.abs(delta) < 10 ? 1 : 0).replace(".", ",")}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {hint && <div className="mt-1 text-sm">{hint}</div>}
    </div>
  );
}
