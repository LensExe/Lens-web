import type { LucideIcon } from "lucide-react";

/** Placeholder for an empty list or filter result. `bare` drops the dashed
 *  frame — for use inside a card (e.g. DataTable's `empty`). */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  bare,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  bare?: boolean;
}) {
  return (
    <div
      className={
        bare
          ? "flex flex-col items-center px-6 py-8 text-center"
          : "flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center"
      }
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
