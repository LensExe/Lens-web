import { MessagesSquare } from "lucide-react";
import { PageContainer } from "@lens/ui";

export function Messages() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <MessagesSquare className="size-7" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">Tin nhắn chưa khả dụng</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        lens-backend hiện chưa cung cấp API hội thoại, tin nhắn hoặc trạng thái đã đọc. Màn hình này sẽ hoạt động khi backend bổ sung các endpoint đó.
      </p>
    </PageContainer>
  );
}
