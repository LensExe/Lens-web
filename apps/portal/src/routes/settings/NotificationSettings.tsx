import { Skeleton, Switch, toast } from "@lens/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useMyProfile, useUpdateProfile } from "@/queries/useProfile";
import { NOTIFICATION_OPTIONS } from "@/lib/profile";

// Each switch saves on its own — no form, no save bar.
export function NotificationSettings() {
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateProfile();

  return (
    <SettingsSection
      title="Thông báo"
      description="Chọn những thông báo bạn muốn nhận qua ứng dụng và email."
    >
      {isLoading || !profile ? (
        <div className="space-y-3">
          {NOTIFICATION_OPTIONS.map((o) => (
            <Skeleton key={o.key} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {NOTIFICATION_OPTIONS.map((o) => (
            <label
              key={o.key}
              className="flex cursor-pointer items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <span>
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block text-sm text-muted-foreground">{o.hint}</span>
              </span>
              <Switch
                checked={profile.notifications[o.key]}
                disabled={update.isPending}
                onCheckedChange={(checked) =>
                  update.mutate(
                    { notifications: { ...profile.notifications, [o.key]: checked } },
                    {
                      onSuccess: () => toast.success("Đã cập nhật thông báo"),
                      onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
                    }
                  )
                }
              />
            </label>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
