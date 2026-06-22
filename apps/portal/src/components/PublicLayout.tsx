import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Aperture,
  CalendarCheck,
  Camera,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeToggle,
  cn,
} from "@lens/ui";
import { currentUser, hasRole } from "@/lib/session";
import type { UserRole } from "@/types";

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

type MenuItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Roles allowed to see this menu item. */
  allow: UserRole[];
};

const menu: MenuItem[] = [
  { to: "/client", label: "Khu vực khách hàng", icon: LayoutDashboard, allow: ["client", "photographer"] },
  { to: "/client/bookings", label: "Lịch đặt của tôi", icon: CalendarCheck, allow: ["client", "photographer"] },
  { to: "/dashboard", label: "Khu vực nhiếp ảnh gia", icon: Camera, allow: ["photographer"] },
  { to: "/client/reviews", label: "Đánh giá của tôi", icon: Star, allow: ["client", "photographer"] },
  { to: "/messages", label: "Tin nhắn", icon: MessageSquare, allow: ["client", "photographer"] },
];

const itemClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";

function AccountMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Tài khoản"
          className="rounded-full outline-none ring-offset-2 ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-64 overflow-hidden rounded-2xl p-0">
        {/* User header */}
        <div className="flex items-center gap-3 bg-muted/50 p-4">
          <Avatar className="size-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-1.5">
          {menu
            .filter((m) => hasRole(m.allow, currentUser.role))
            .map((m) => (
            <Link key={m.to} to={m.to} onClick={() => setOpen(false)} className={itemClass}>
              <m.icon className="size-4 text-muted-foreground" />
              {m.label}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-border p-1.5">
          <a href={LANDING_URL} className={cn(itemClass, "text-destructive hover:text-destructive")}>
            <LogOut className="size-4" />
            Đăng xuất
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-foreground text-background">
              <Aperture className="size-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight">Lens</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Nhiếp ảnh gia
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 Lens. Mọi quyền được bảo lưu.</p>
          <a href={LANDING_URL} className="transition-colors hover:text-foreground">
            Về trang chủ
          </a>
        </div>
      </footer>
    </div>
  );
}
