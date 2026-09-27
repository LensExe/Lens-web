import { Link, useLocation } from "react-router-dom";
import { cn } from "@lens/ui";
import { CLIENT_LINKS } from "@/components/workspace/nav";

/**
 * The client's top navigation. `inline` sits in the header on md+ (text links,
 * underlined when active); `pills` is the phone version — a scrollable row
 * rendered just below the header.
 */
export function ClientNav({ variant }: { variant: "inline" | "pills" }) {
  const { pathname } = useLocation();

  if (variant === "inline") {
    return (
      <nav aria-label="Khu khách hàng" className="hidden h-full items-stretch gap-1 md:flex">
        {CLIENT_LINKS.map(({ to, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring relative flex items-center px-3 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground" />}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Khu khách hàng" className="border-b border-border/60 bg-background md:hidden">
      <div className="flex gap-2 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CLIENT_LINKS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
