import { NavLink } from "react-router-dom";
import { CountBadge, cn } from "@lens/ui";
import { NAV_GROUPS } from "@/components/layout/nav";
import type { AdminQueue } from "@/types";

/** Grouped console menu with icons and "waiting on you" badges. */
export function AdminNav({
  queue,
  onNavigate,
}: {
  queue?: AdminQueue;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Điều hướng quản trị">
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, badge }) => {
              const count = badge && queue ? queue[badge] : 0;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "focus-ring flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors",
                      isActive
                        ? "bg-foreground font-medium text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <Icon className="size-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                  <CountBadge count={count} className="ml-auto" />
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
