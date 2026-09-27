import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ExternalLink, Menu } from "lucide-react";
import {
  Button,
  Logo,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
} from "@lens/ui";
import { AdminNav } from "@/components/layout/AdminNav";
import { AdminUserCard } from "@/components/layout/AdminUserCard";
import { titleFor } from "@/components/layout/nav";
import { useAdminQueue } from "@/queries/useStats";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

function Brand() {
  return (
    <Link
      to="/"
      className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5"
      aria-label="Lens Admin — tổng quan"
    >
      <Logo className="h-6" />
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Quản trị
      </span>
    </Link>
  );
}

// The console shell: full-height sidebar (grouped menu with queue badges +
// the signed-in admin), a sticky header naming the page, wide content.
export function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: queue } = useAdminQueue();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
        <Brand />
        <AdminNav queue={queue} />
        <AdminUserCard />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
                <SheetTitle className="sr-only">Điều hướng</SheetTitle>
                <Brand />
                <AdminNav queue={queue} onNavigate={() => setNavOpen(false)} />
                <AdminUserCard />
              </SheetContent>
            </Sheet>
            <span className="truncate font-medium">{titleFor(pathname)}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" className="hidden rounded-full lg:inline-flex">
              <a href={PORTAL_URL} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Xem trang công khai
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
