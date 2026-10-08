import type { ReactNode } from "react";

/** A titled card grouping related settings. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
