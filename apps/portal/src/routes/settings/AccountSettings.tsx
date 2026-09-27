import { BadgeCheck, Camera, Mail, UserRound } from "lucide-react";
import { Skeleton } from "@lens/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { useMyProfile } from "@/queries/useProfile";
import { currentUser } from "@/lib/session";

const ROLE_INFO = {
  client: {
    label: "Khách hàng",
    hint: "Tìm, đặt lịch và quản lý các buổi chụp của bạn.",
    icon: UserRound,
  },
  photographer: {
    label: "Nhiếp ảnh gia",
    hint: "Nhận lịch chụp, quản lý hồ sơ năng lực và thu nhập.",
    icon: Camera,
  },
  admin: { label: "Quản trị", hint: "", icon: UserRound },
} as const;

export function AccountSettings() {
  const { data: profile, isLoading } = useMyProfile();
  const role = ROLE_INFO[currentUser.role];

  return (
    <div className="space-y-5">
      <SettingsSection title="Email đăng nhập" description="Email dùng để đăng nhập và nhận thông báo.">
        {isLoading || !profile ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <Mail className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{profile.email}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <BadgeCheck className="size-3" />
              Đã xác minh
            </span>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Mật khẩu" description="Nên dùng mật khẩu mạnh và không dùng lại ở nơi khác.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tracking-widest text-muted-foreground">••••••••</p>
          <ChangePasswordDialog />
        </div>
      </SettingsSection>

      <SettingsSection title="Loại tài khoản">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
            <role.icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{role.label}</p>
            <p className="text-sm text-muted-foreground">{role.hint}</p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
