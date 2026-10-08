import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { cn, PageContainer, PageHeader } from "@lens/ui";

const SECTIONS = [
  { to: "profile", label: "Hồ sơ cá nhân", icon: UserRound },
  { to: "account", label: "Tài khoản & bảo mật", icon: ShieldCheck },
  { to: "notifications", label: "Thông báo", icon: Bell },
];

// Settings for both roles: a compact category rail on desktop and a horizontal
// scrollable menu on mobile. The outlet stays responsible for each form's data.
export function SettingsLayout() {
  const { pathname } = useLocation();
  const isAccount = pathname.endsWith("/account");
  const isProfile = pathname.endsWith("/profile");

  return (
    <PageContainer className="max-w-[1280px]">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-[1180px]"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-ember/15 bg-ember/10 text-ember">
              <Settings2 className="size-5" />
            </span>
            <span>Cài đặt</span>
          </span>
        }
        description="Quản lý thông tin cá nhân, tài khoản và thông báo của bạn."
      />

      <div className="mx-auto grid w-full max-w-[1180px] gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-5">
        <nav
          aria-label="Mục cài đặt"
          className="rounded-2xl border border-border bg-card p-2.5 shadow-xs lg:sticky lg:top-24 lg:self-start lg:p-3"
        >
          <div className="hidden border-b border-border px-2 pb-3 lg:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Danh mục
            </p>
            <p className="mt-1 text-xs font-medium text-foreground">Tài khoản của bạn</p>
          </div>

          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pt-2">
            {SECTIONS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "focus-ring group flex min-h-10 shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-all lg:w-full",
                    isActive
                      ? "bg-orange-50 font-semibold text-foreground ring-1 ring-orange-200/80 dark:bg-orange-500/10 dark:ring-orange-500/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-ember text-white shadow-xs"
                          : "bg-muted/70 text-muted-foreground group-hover:bg-card group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
                    <ChevronRight className={cn("hidden size-3.5 lg:block", isActive ? "text-ember" : "text-muted-foreground/60")} />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {isProfile && (
            <div className="mt-3 rounded-xl border border-orange-200/80 bg-orange-50/70 p-3 dark:border-orange-500/20 dark:bg-orange-500/10">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                <span className="flex size-4 items-center justify-center rounded-full border border-orange-300 text-[9px]">!</span>
                Cần hỗ trợ đổi thông tin?
              </p>
              <p className="mt-1 text-[9px] leading-4 text-orange-800/75 dark:text-orange-200/70">
                Nếu cần thay đổi số điện thoại hoặc email liên kết, vui lòng liên hệ bộ phận CSKH Lens.
              </p>
            </div>
          )}

          {isAccount && (
            <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Lens Bảo vệ tài khoản
              </p>
              <p className="mt-1 text-[9px] leading-4 text-emerald-800/75 dark:text-emerald-200/70">
                Lens không bao giờ yêu cầu cung cấp mật khẩu hoặc mã OTP qua tin nhắn riêng.
              </p>
            </div>
          )}
        </nav>

        <main className="min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </PageContainer>
  );
}
