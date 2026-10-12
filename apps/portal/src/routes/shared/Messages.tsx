import { useSearchParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { useConversations } from "@/queries/useMessages";

export function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: conversations = [], isLoading, isError } = useConversations();
  const selectedId = searchParams.get("conversation");
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const selectConversation = (id: string | null) => {
    setSearchParams(id ? { conversation: id } : {});
  };

  return (
    <div className="mx-auto flex h-full max-w-[1480px] gap-0 p-3 md:p-5">
      <aside className={`flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card md:w-[360px] ${selectedId ? "hidden md:flex" : ""}`}>
        <header className="border-b border-border px-4 py-4">
          <h2 className="font-semibold">Hội thoại</h2>
          <p className="mt-1 text-xs text-muted-foreground">Tin nhắn được đồng bộ từ Chat Service.</p>
        </header>
        {isError ? (
          <p role="alert" className="m-4 rounded-xl border border-destructive/30 p-3 text-sm text-destructive">Không tải được danh sách hội thoại. Hãy kiểm tra API chat và quyền của tài khoản.</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={(id) => selectConversation(id)}
            />
          </div>
        )}
      </aside>

      <section className={`min-w-0 flex-1 overflow-hidden md:ml-4 md:rounded-2xl md:border md:border-border md:bg-card ${selectedId ? "" : "hidden md:flex"}`}>
        {selected ? (
          <MessageThread
            conversation={selected}
            onBack={() => selectConversation(null)}
          />
        ) : selectedId && isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Đang mở hội thoại…</div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <MessagesSquare className="size-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Chọn một hội thoại</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Mở chat từ hồ sơ photographer hoặc chi tiết booking để bắt đầu trao đổi.</p>
          </div>
        )}
      </section>
    </div>
  );
}
