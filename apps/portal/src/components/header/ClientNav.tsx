import { Link, useLocation } from "react-router-dom";
import { cn } from "@lens/ui";
import { CLIENT_LINKS } from "@/components/workspace/nav";

/**
 * The client's top navigation. `inline` sits in the header on md+; `pills` is
 * the phone version — a scrollable row
 * rendered just below the header.
 */
export function ClientNav({ variant }: { variant: "inline" | "pills" }) {
  const { pathname } = useLocation();

  if (variant === "inline") {
    return (
      <nav aria-label="Khu khách hàng" className="hidden h-full items-center gap-1.5 md:flex">
        {CLIENT_LINKS.map(({ to, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring relative flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Khu khách hàng" className="border-b border-border/70 bg-background/95 md:hidden">
      <div className="flex gap-2 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CLIENT_LINKS.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
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
