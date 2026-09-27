import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/**
 * The page wrapper for app workspaces (portal + admin): left-aligned with the
 * header title and wide enough to use the space next to the sidebar — pages lay
 * their content out in grids inside it instead of a narrow centred column.
 */
export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full max-w-[1440px] px-5 py-8 md:px-8 md:py-10", className)}>
      {children}
    </div>
  );
}
