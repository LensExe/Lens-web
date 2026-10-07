import { Sparkles } from "lucide-react";
import { PageContainer } from "@lens/ui";

export function PhotographerAssistant() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-3xl bg-ember/10 text-ember">
        <Sparkles className="size-7" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">Trợ lý AI chưa khả dụng</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        lens-backend hiện chưa có API cấu hình trợ lý hoặc tích hợp AI vào hội thoại. Dữ liệu huấn luyện và trạng thái bật/tắt chưa được lưu.
      </p>
    </PageContainer>
  );
}
