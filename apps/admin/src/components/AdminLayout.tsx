import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Menu, ShieldCheck } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
  cn,
} from "@lens/ui";

const links = [
  { to: "/", label: "Tổng quan" },
  { to: "/photographers", label: "Duyệt nhiếp ảnh gia" },
  { to: "/users", label: "Quản lý người dùng" },
  { to: "/reports", label: "Báo cáo & thống kê" },
];

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {links.map((link) => (
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
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-border px-5">
      <span className="flex size-8 items-center justify-center rounded-xl bg-foreground text-background">
        <ShieldCheck className="size-4" />
      </span>
      <span className="font-semibold tracking-tight">Lens Admin</span>
    </div>
  );
}

export function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
        <Brand />
        <NavLinks />
      </aside>

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
                <NavLinks onNavigate={() => setNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="truncate text-sm text-muted-foreground">
              Bảng quản trị hệ thống
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" className="rounded-full" asChild>
              <a href={LANDING_URL}>
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
