import { Skeleton, Switch, toast } from "@lens/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useMyProfile, useUpdateProfile } from "@/queries/useProfile";
import type { NotificationPrefs } from "@/types";

const preferences: { key: keyof NotificationPrefs; title: string; detail: string }[] = [
  { key: "bookingUpdates", title: "Cập nhật lịch đặt", detail: "Xác nhận, thay đổi và trạng thái booking." },
  { key: "messages", title: "Thông báo tin nhắn", detail: "Báo khi có tin nhắn mới trong cuộc hội thoại." },
  { key: "promotions", title: "Ưu đãi và tin sản phẩm", detail: "Thông tin chương trình và tính năng mới." },
  { key: "emailDigest", title: "Tóm tắt qua email", detail: "Email tổng hợp hoạt động định kỳ." },
];

export function NotificationSettings() {
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateProfile();

  return (
    <SettingsSection
      title="Thông báo"
      description="Chọn các loại thông báo bạn muốn nhận."
    >
      <div className="divide-y divide-border/70">
        {preferences.map(({ key, title, detail }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </div>
            {isLoading || !profile ? (
              <Skeleton className="h-6 w-11 rounded-full" />
            ) : (
              <Switch
                checked={profile.notifications[key]}
                disabled={update.isPending}
                onCheckedChange={(checked) => update.mutate(
                  { notifications: { ...profile.notifications, [key]: checked } },
                  { onError: () => toast.error("Không lưu được tuỳ chọn thông báo") },
                )}
                aria-label={title}
              />
            )}
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
