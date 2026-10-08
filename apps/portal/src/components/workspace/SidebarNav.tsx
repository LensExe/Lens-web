import { NavLink } from "react-router-dom";
import { CountBadge, cn } from "@lens/ui";
import type { NavGroup } from "./nav";

/** The workspace menu: grouped links with icons. */
export function SidebarNav({
  groups,
  badges,
  onNavigate,
}: {
  groups: NavGroup[];
  /** Counts shown next to items, keyed by path (e.g. unread messages). */
  badges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5" aria-label="Điều hướng">
      {groups.map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                // Section roots (e.g. /dashboard/bookings) stay active on their
                // detail pages; the studio home matches exactly.
                end={to === "/dashboard"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "focus-ring flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                    isActive
                      ? "bg-foreground font-medium text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <Icon className="size-[18px] shrink-0" />
                {label}
                <CountBadge count={badges?.[to] ?? 0} className="ml-auto" />
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
