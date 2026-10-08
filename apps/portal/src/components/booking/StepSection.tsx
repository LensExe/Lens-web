import type { ReactNode } from "react";
import { cn } from "@lens/ui";

/** A numbered card for one part of a booking step. */
export function StepSection({
  index,
  title,
  aside,
  className,
  children,
}: {
  index?: number;
  title: string;
  /** Right side of the title row (a badge, an "edit" link…). */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)] sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          {index !== undefined && (
            <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {index}
            </span>
          )}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
