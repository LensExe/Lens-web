import type { ReactNode } from "react";

const WEEKDAY = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const todayLabel = () => {
  const d = new Date();
  return `${WEEKDAY[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/**
 * Overview header: today's date, a greeting, one line on what needs doing and
 * the single most useful next action (the page's one Ember CTA).
 */
export function GreetingBanner({
  title,
  summary,
  action,
}: {
  title: string;
  summary: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{todayLabel()}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{summary}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
