import { Suspense, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Eye, Menu } from "lucide-react";
import { Button, Logo, Sheet, SheetContent, SheetTitle, SheetTrigger } from "@lens/ui";
import { HeaderActions } from "@/components/header/HeaderActions";
import { PageFallback } from "@/components/workspace/PageFallback";
import { SidebarNav } from "@/components/workspace/SidebarNav";
import { SidebarUserCard } from "@/components/workspace/SidebarUserCard";
import { STUDIO_NAV, studioTitleFor } from "@/components/workspace/nav";
import { currentUser } from "@/lib/session";
import { useConversations } from "@/queries/useMessages";

function Brand() {
  return (
    <Link
      to="/dashboard"
      className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5"
      aria-label="Lens Studio — bảng điều khiển"
    >
      <Logo className="h-6" />
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Studio</span>
    </Link>
  );
}

// The photographer's studio: a full-height grouped sidebar (many tools), a
// sticky header naming the page, and pages rendered wide in <PageContainer>.
export function StudioShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  // Same query as the header's message menu — no extra request.
  const { data: conversations = [] } = useConversations();
  const badges = { "/messages": conversations.reduce((n, c) => n + c.unreadCount, 0) };

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar — full height, stays put while the page scrolls */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-muted/20 md:flex">
        <Brand />
        <SidebarNav groups={STUDIO_NAV} badges={badges} />
        <SidebarUserCard />
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
                <SidebarNav groups={STUDIO_NAV} badges={badges} onNavigate={() => setNavOpen(false)} />
                <SidebarUserCard />
              </SheetContent>
            </Sheet>
            <span className="truncate font-medium">{studioTitleFor(pathname)}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" className="hidden rounded-full lg:inline-flex">
              <Link to={`/photographers/${currentUser.id}`}>
                <Eye className="size-4" />
                Xem hồ sơ công khai
              </Link>
            </Button>
            <HeaderActions />
          </div>
        </header>

        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
