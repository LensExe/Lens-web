import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, Logo, Skeleton } from "@lens/ui";
import { HeaderActions } from "@/components/header/HeaderActions";
import { homeFor, logoHref } from "@/components/workspace/nav";
import { currentUser } from "@/lib/session";

/**
 * Full-screen messaging: a thin top bar (back to the workspace, brand, header
 * actions) and the inbox filling the rest of the viewport — no sidebar.
 */
export function MessagesLayout() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground">
            <Link to={homeFor(currentUser.role)} aria-label="Về khu làm việc">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Về khu làm việc</span>
            </Link>
          </Button>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <Link to={logoHref(currentUser.role)} aria-label="Lens — trang chủ" className="hidden sm:block">
            <Logo className="h-5" />
          </Link>
          <h1 className="truncate font-semibold">Tin nhắn</h1>
        </div>
        <HeaderActions />
      </header>

      <main className="min-h-0 flex-1">
        <Suspense fallback={<Skeleton className="m-5 h-[calc(100%-2.5rem)] rounded-2xl" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
