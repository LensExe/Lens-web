import { useState } from "react";
import { BadgeCheck, Camera, LogOut, Mail, Monitor, UserRound } from "lucide-react";
import { Button, Skeleton, Switch, toast } from "@lens/ui";
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
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <div className="space-y-5">
      <SettingsSection title="Email đăng nhập" description="Email dùng để đăng nhập và nhận thông báo.">
        {isLoading || !profile ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/25 px-3 py-2.5 sm:flex-nowrap sm:px-4 sm:py-3">
            <Mail className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{profile.email}</span>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <BadgeCheck className="size-3" />
                Đã xác minh
              </span>
              <Button type="button" variant="outline" size="sm" className="h-7 rounded-lg text-[10px]" onClick={() => toast("Tính năng đổi email sẽ sớm khả dụng")}>
                Thay đổi email
              </Button>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Mật khẩu" description="Nên dùng mật khẩu mạnh và không dùng lại ở nơi khác.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/25 px-3 py-2.5 sm:px-4 sm:py-3">
          <div>
            <p className="text-sm tracking-widest text-muted-foreground">••••••••</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Lần đổi gần nhất: 3 tháng trước (08/06/2026)</p>
          </div>
          <ChangePasswordDialog />
        </div>
      </SettingsSection>

      <SettingsSection title="Loại tài khoản">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/25 px-3 py-2.5 sm:px-4 sm:py-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
            <role.icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{role.label}</p>
            <p className="text-sm text-muted-foreground">{role.hint}</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Bảo mật nâng cao & Phiên đăng nhập" description="Tăng cường lớp bảo vệ cho tài khoản khi đăng nhập trên thiết bị lạ.">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold">Xác thực 2 bước (2FA) qua SMS/Email</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Yêu cầu mã xác thực 6 số mỗi khi có hoạt động đăng nhập mới.</p>
            </div>
            <Switch
              checked={twoFactor}
              className="data-[state=checked]:bg-ember"
              onCheckedChange={(checked) => {
                setTwoFactor(checked);
                toast.success(checked ? "Đã bật xác thực 2 bước" : "Đã tắt xác thực 2 bước");
              }}
              aria-label="Xác thực 2 bước"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <Monitor className="size-3.5" />
              Thiết bị hiện tại: Chrome trên macOS (Hà Nội, VN)
            </div>
            <Button type="button" variant="outline" size="sm" className="h-7 rounded-lg text-[10px] text-destructive hover:text-destructive" onClick={() => toast("Đã gửi yêu cầu đăng xuất các thiết bị khác")}>
              <LogOut className="size-3.5" />
              Đăng xuất thiết bị khác
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
