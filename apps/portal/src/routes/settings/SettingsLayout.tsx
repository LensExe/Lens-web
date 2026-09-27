import { NavLink, Outlet } from "react-router-dom";
import { Bell, ShieldCheck, UserRound } from "lucide-react";
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
    <PageContainer>
      <PageHeader
        title="Cài đặt"
        description="Quản lý thông tin cá nhân, tài khoản và thông báo của bạn."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Mục cài đặt"
          className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none] lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0"
        >
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "focus-ring flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 max-w-3xl">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
