import { cn } from "../../lib/utils";

/**
 * The one notification count style across Lens (unread messages, items waiting
 * on an admin…): an Ember pill. Renders nothing for 0; caps at `max` ("9+").
 * `onIcon` adds a ring so it reads cleanly when it overlaps an icon button.
 */
export function CountBadge({
  count,
  max = 99,
  onIcon,
  className,
}: {
  count: number;
  max?: number;
  onIcon?: boolean;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ember px-1.5 text-[11px] font-semibold tabular-nums leading-none text-white",
        onIcon && "ring-2 ring-background",
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
