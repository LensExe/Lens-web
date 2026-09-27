import type { ReactNode } from "react";

/** A numbered card for one part of a booking step. */
export function StepSection({
  index,
  title,
  aside,
  children,
}: {
  index?: number;
  title: string;
  /** Right side of the title row (a badge, an "edit" link…). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          {index !== undefined && (
            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
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
