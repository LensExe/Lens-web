import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** When set, the whole card becomes a link (used for actionable stats). */
  to?: string;
  /** Extra content under the label (e.g. a small CTA line). */
  hint?: string;
};

/** Shared metric tile — icon badge, big value, muted label. Used by both the
 *  client and photographer overview pages. */
export function StatCard({ icon: Icon, value, label, to, hint }: StatCardProps) {
  const body = (
    <>
      <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {hint && (
        <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">{hint}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
      >
        {body}
      </Link>
    );
  }

  return <div className="rounded-2xl border border-border bg-card p-5">{body}</div>;
}
