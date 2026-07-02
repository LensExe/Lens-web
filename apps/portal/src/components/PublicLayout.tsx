import { Link, Outlet } from "react-router-dom";
import { Logo } from "@lens/ui";
import { HeaderActions } from "@/components/header/HeaderActions";

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
          <Link to="/" className="flex items-center" aria-label="Lens">
            <Logo className="h-7" />
          </Link>

          <HeaderActions />
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
