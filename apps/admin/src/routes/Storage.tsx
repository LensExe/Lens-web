import { HardDrive } from "lucide-react";
import { PageContainer, PageHeader } from "@lens/ui";

export function Storage() {
  return (
    <PageContainer>
      <PageHeader title="Dung lượng lưu trữ" description="Theo dõi dung lượng media và quota của nhiếp ảnh gia." />
      <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
        <HardDrive className="mt-0.5 size-5 shrink-0" />
        <div><p className="font-semibold">Backend chưa có endpoint báo cáo storage toàn hệ thống.</p><p className="mt-1">Có API quản lý media và subscription theo từng tài khoản, nhưng chưa có danh sách toàn bộ gallery, mức dùng, quota và tài khoản vượt quota cho admin.</p></div>
      </div>
    </PageContainer>
  );
}
