import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, Logo, ThemeToggle } from "@lens/ui";
import { useFeaturedPhotographers } from "@/queries/usePhotographers";

// Auth pages (login / signup): a focused split screen WITHOUT the marketing
// navbar — so nothing can open on top of the form. The right half shows a
// featured photographer's work: on Lens, the photos are the product.
export function AuthLayout() {
  const { pathname } = useLocation();
  const { data } = useFeaturedPhotographers();
  const spotlight = data?.[pathname.startsWith("/signup") ? 1 : 0] ?? data?.[0];

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="focus-ring rounded-lg" aria-label="Lens — về trang chủ">
            <Logo className="h-7" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Trang chủ
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </main>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Lens. Mọi quyền được bảo lưu.
        </p>
      </div>

      <aside className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="relative h-full overflow-hidden rounded-[36px] bg-muted">
          {spotlight && (
            <>
              <img
                src={spotlight.cover}
                alt={`Tác phẩm của ${spotlight.name}`}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-10 text-white">
                <p className="max-w-md text-3xl font-semibold leading-tight">
                  Mỗi khung hình là một câu chuyện đáng được kể.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={spotlight.avatar}
                    alt=""
                    className="size-10 rounded-full object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <p className="text-sm font-medium">{spotlight.name}</p>
                    <p className="text-xs text-white/70">
                      {spotlight.styles.join(" · ")} · {spotlight.city}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
