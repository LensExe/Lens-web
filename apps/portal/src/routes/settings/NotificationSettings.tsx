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
              className="flex cursor-pointer items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  {o.label}
                  {o.key === "bookingUpdates" && (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-medium text-ember dark:bg-orange-500/15">
                      Quan trọng
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{o.hint}</span>
              </span>
              <Switch
                checked={profile.notifications[o.key]}
                className="data-[state=checked]:bg-ember"
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
