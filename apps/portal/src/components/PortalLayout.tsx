import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import {
  Button,
  Logo,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
  cn,
} from "@lens/ui";
import { clearSession, currentUser, hasRole } from "@/lib/session";
import type { UserRole } from "@/types";

type NavGroup = {
  label: string;
  /** Roles allowed to see this group. */
  allow: UserRole[];
  links: { to: string; label: string }[];
};

const groups: NavGroup[] = [
  {
    label: "Khách hàng",
    allow: ["client", "photographer"],
    links: [
      { to: "/client", label: "Tổng quan" },
      { to: "/client/bookings", label: "Lịch đặt" },
      { to: "/client/reviews", label: "Đánh giá" },
    ],
  },
  {
    label: "Nhiếp ảnh gia",
    allow: ["photographer"],
    links: [
      { to: "/dashboard", label: "Bảng điều khiển" },
      { to: "/dashboard/portfolio", label: "Hồ sơ năng lực" },
      { to: "/dashboard/availability", label: "Lịch trống" },
      { to: "/dashboard/bookings", label: "Yêu cầu đặt lịch" },
    ],
  },
  {
    label: "Khác",
    allow: ["client", "photographer"],
    links: [{ to: "/messages", label: "Tin nhắn" }],
  },
];

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

function Brand() {
  return (
    <Link to="/" className="flex h-16 items-center gap-2 border-b border-border px-5" aria-label="Lens Portal">
      <Logo className="h-6" />
      <span className="text-sm font-medium text-muted-foreground">Portal</span>
    </Link>
  );
}

function NavGroups({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-4">
      {groups
        .filter((group) => hasRole(group.allow, currentUser.role))
        .map((group) => (
          <div key={group.label}>
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-xl px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
    </nav>
  );
}

export function PortalLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
        <Brand />
        <NavGroups />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-2 border-b border-border px-4 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {/* Mobile nav trigger */}
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Điều hướng</SheetTitle>
                <Brand />
                <NavGroups onNavigate={() => setNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="truncate text-sm text-muted-foreground">
              <span className="md:hidden">Lens Portal</span>
              <span className="hidden md:inline">Khu vực khách hàng &amp; nhiếp ảnh gia</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" className="rounded-full" asChild>
              <a href={LANDING_URL} onClick={clearSession}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </a>
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
