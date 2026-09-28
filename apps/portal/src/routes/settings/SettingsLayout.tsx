import { NavLink, Outlet } from "react-router-dom";
import { Bell, ChevronRight, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { cn, PageContainer, PageHeader } from "@lens/ui";

const SECTIONS = [
  { to: "profile", label: "Hồ sơ cá nhân", icon: UserRound },
  { to: "account", label: "Tài khoản & bảo mật", icon: ShieldCheck },
  { to: "notifications", label: "Thông báo", icon: Bell },
];

// Settings for both roles: section menu on the left (a scrollable pill row on
// mobile), the selected section's form on the right.
export function SettingsLayout() {
  return (
    <PageContainer className="max-w-[1280px]">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <Settings2 className="size-5" />
            </span>
            <span>Cài đặt</span>
          </span>
        }
        description="Quản lý thông tin cá nhân, tài khoản và thông báo của bạn."
      />

      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <nav
          aria-label="Mục cài đặt"
          className="rounded-3xl border border-border bg-card p-2 shadow-xs lg:sticky lg:top-24 lg:self-start lg:p-3"
        >
          <div className="hidden border-b border-border px-2 pb-3 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Danh mục
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Tài khoản của bạn</p>
          </div>

          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pt-2">
            {SECTIONS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "focus-ring group flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors lg:w-full",
                    isActive
                      ? "bg-muted font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl transition-colors",
                        isActive
                          ? "bg-card text-foreground shadow-xs"
                          : "bg-muted/60 text-muted-foreground group-hover:bg-card group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
                    <ChevronRight className="hidden size-4 text-muted-foreground/70 lg:block" />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="min-w-0 w-full max-w-4xl">
          <Outlet />
        </main>
      </div>
    </PageContainer>
  );
}
