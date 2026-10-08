import type { ReactNode } from "react";
import { cn } from "@lens/ui";
import type { StatusMeta } from "@/lib/status";

/**
 * Tinted status pill from a `*_META` entry (lib/status.ts). States get a
 * leading dot in the pill's own colour; pass `dot={false}` for plain
 * categories (role, plan) and when an icon is given.
 */
export function StatusPill({
  meta,
  icon,
  dot = !icon,
  className,
}: {
  meta: StatusMeta;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {icon}
      {meta.label}
    </span>
  );
}
