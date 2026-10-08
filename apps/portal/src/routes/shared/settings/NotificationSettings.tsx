import { SettingsSection } from "@/components/settings/SettingsSection";

export function NotificationSettings() {
  return (
    <SettingsSection
      title="Thông báo"
      description="Backend hiện chưa cung cấp API lưu tuỳ chọn thông báo."
    >
      <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-4 text-sm text-muted-foreground">
        Các tuỳ chọn nhận thông báo chưa được kết nối. Mình đã ẩn công tắc giả để thay đổi không bị mất khi tải lại trang.
      </p>
    </SettingsSection>
  );
}
